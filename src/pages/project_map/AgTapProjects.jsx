import { useState, useRef, useEffect } from 'react';
import { Card, Divider, Image, Button } from 'antd';
import { EnvironmentOutlined, ArrowUpOutlined } from '@ant-design/icons';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import projectData from './agtap_projects.json';

// Fix default Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const goldIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

const OREGON_CENTER = [43.8041, -120.5542];
const OREGON_BOUNDS = [[41.9918, -124.5662], [46.2991, -116.4635]];

// City coordinate lookup for fallback
const CITY_COORDS = {
    Albany: [44.6365, -123.1059], Ashland: [42.1946, -122.7095], Astoria: [46.1879, -123.8313],
    'Baker City': [44.7749, -117.8344], Beaverton: [45.4871, -122.8037], Bend: [44.0582, -121.3153],
    'Coos Bay': [43.3665, -124.2179], Corvallis: [44.5646, -123.262], Eugene: [44.0521, -123.0868],
    'Grants Pass': [42.439, -123.3284], Hermiston: [45.8404, -119.2894], Hillsboro: [45.5229, -122.9898],
    'Hood River': [45.7054, -121.5212], 'Klamath Falls': [42.2249, -121.7817], 'La Grande': [45.3246, -118.0877],
    McMinnville: [45.2104, -123.1987], Medford: [42.3265, -122.8756], Newport: [44.6368, -124.0534],
    Ontario: [44.0266, -116.9629], Pendleton: [45.6721, -118.7886], Portland: [45.5152, -122.6784],
    Roseburg: [43.2165, -123.3417], Salem: [44.9429, -123.0351], Seaside: [45.9932, -123.9226],
    'The Dalles': [45.5946, -121.1787], Creswell: [43.9176, -123.0262], Tumalo: [44.1498, -121.3309],
    Clarno: [44.9133, -120.4733], Madras: [44.6332, -121.1297], 'Willamette Valley': [44.0521, -123.0868],
};

const lookupCity = (cityStr) => {
    const name = cityStr.replace(/,\s*OR$/i, '').trim();
    const key = Object.keys(CITY_COORDS).find(k => k.toLowerCase() === name.toLowerCase());
    return key ? CITY_COORDS[key] : null;
};

const normalizeProjects = (projects) =>
    projects.map((project, index) => {
        let coordinates = [];
        let locationLabel = '';

        const loc = project.location;
        if (loc && typeof loc === 'object') {
            if (Array.isArray(loc.coordinates)) {
                if (loc.coordinates.length === 0) {
                    coordinates = [];
                    locationLabel = 'Statewide (Multiple Locations)';
                } else if (loc.coordinates.length === 2 && typeof loc.coordinates[0] === 'number') {
                    coordinates = [loc.coordinates];
                    locationLabel = (Array.isArray(loc.city) ? loc.city[0] : loc.city) ||
                        `${loc.coordinates[0].toFixed(4)}, ${loc.coordinates[1].toFixed(4)}`;
                } else if (Array.isArray(loc.coordinates[0])) {
                    coordinates = loc.coordinates;
                    locationLabel = Array.isArray(loc.city) ? loc.city.join(', ') : `${coordinates.length} Locations`;
                }
            } else if (loc.city && !loc.coordinates) {
                const cityName = Array.isArray(loc.city) ? loc.city[0] : loc.city;
                const found = lookupCity(cityName);
                locationLabel = (Array.isArray(loc.city) ? loc.city.join(', ') : loc.city) +
                    (loc.county ? `, ${loc.county} County` : '');
                coordinates = found ? [found] : [];
            }
        }

        return {
            id: project.id || index + 1,
            name: project.name,
            location: locationLabel,
            coordinates,
            description: project.description || 'No description provided.',
            principal: project.project_lead || project.principal || 'Not specified',
            contact: project.contact || 'Not specified',
            facultyWebpage: project.faculty_webpage || null,
            isStatewide: loc?.type === 'Statewide' || loc?.city === 'Multiple',
            photos: project.photos || [],
        };
    });

const AgTapProjects = () => {
    const [projects] = useState(() =>
        projectData && projectData.projects ? normalizeProjects(projectData.projects) : []
    );
    const [selectedProject, setSelectedProject] = useState(null);
    const mapDivRef = useRef(null);
    const mapRef = useRef(null);
    const markersRef = useRef([]);

    const toggleProject = (id) => {
        setSelectedProject(prev => (prev === id ? null : id));
    };

    const scrollToMapTop = (e) => {
        e.stopPropagation();
        if (mapDivRef.current) {
            mapDivRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const flyToMarker = (e, coord, projectId) => {
        e.stopPropagation();
        if (!mapDivRef.current || !mapRef.current) return;
        mapDivRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setTimeout(() => {
            if (!mapRef.current) return;
            const key = `${coord[0].toFixed(4)},${coord[1].toFixed(4)}`;
            const marker = markersRef.current.find(m => {
                const ll = m.getLatLng();
                return `${ll.lat.toFixed(4)},${ll.lng.toFixed(4)}` === key;
            });
            if (marker) {
                mapRef.current.setView(coord, 10, { animate: true, duration: 0.5 });
                setTimeout(() => marker.openPopup(), 600);
            }
        }, 300);
    };

    // Initialize Leaflet map
    useEffect(() => {
        if (mapDivRef.current && !mapRef.current) {
            const map = L.map(mapDivRef.current, {
                center: OREGON_CENTER,
                zoom: 7,
                minZoom: 6,
                maxZoom: 19,
            });
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            }).addTo(map);
            map.whenReady(() => map.setMaxBounds(OREGON_BOUNDS));
            mapRef.current = map;
        }
        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    // Place markers whenever projects change
    useEffect(() => {
        if (!mapRef.current) return;

        markersRef.current.forEach(m => m.remove());
        markersRef.current = [];

        // Expose global helper so popup buttons can trigger card expansion + scroll
        window.scrollToProject = (id) => {
            setSelectedProject(id);
            setTimeout(() => {
                const card = document.getElementById(`project-card-${id}`);
                if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                if (mapRef.current) mapRef.current.closePopup();
            }, 100);
        };

        // Group projects by coordinate key so overlapping markers share a popup
        const locationGroups = new Map();
        projects.forEach(project => {
            if (!project.coordinates || project.coordinates.length === 0) {
                if (project.isStatewide) {
                    const key = `${OREGON_CENTER[0].toFixed(4)},${OREGON_CENTER[1].toFixed(4)}`;
                    if (!locationGroups.has(key)) locationGroups.set(key, []);
                    locationGroups.get(key).push({ project, locationIndex: -1, coords: OREGON_CENTER, isStatewideAtCenter: true });
                }
                return;
            }
            project.coordinates.forEach((coord, idx) => {
                if (coord && coord.length === 2) {
                    const key = `${coord[0].toFixed(4)},${coord[1].toFixed(4)}`;
                    if (!locationGroups.has(key)) locationGroups.set(key, []);
                    locationGroups.get(key).push({ project, locationIndex: idx, coords: coord, isStatewideAtCenter: false });
                }
            });
        });

        const allCoords = [];
        locationGroups.forEach((entries, key) => {
            const coords = key.split(',').map(Number);
            allCoords.push(coords);

            const isStatewide = entries.some(e => e.isStatewideAtCenter);
            const marker = (isStatewide ? L.marker(coords, { icon: goldIcon }) : L.marker(coords))
                .addTo(mapRef.current);

            let popupHtml;
            if (entries.length === 1) {
                const { project, locationIndex, isStatewideAtCenter } = entries[0];
                const locLabel = isStatewideAtCenter
                    ? 'Statewide Project (Multiple Locations)'
                    : project.coordinates.length > 1
                        ? `Location ${locationIndex + 1} of ${project.coordinates.length}`
                        : project.location;
                popupHtml = `
                    <div style="min-width:220px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
                        <h3 style="margin:0 0 8px 0;font-size:15px;color:${isStatewideAtCenter ? '#faad14' : '#1890ff'};font-weight:600;">${project.name}</h3>
                        <p style="margin:4px 0;font-size:13px;"><strong>Project Lead:</strong> ${project.principal}</p>
                        <p style="margin:4px 0;font-size:12px;color:#666;"><strong>Location:</strong> ${locLabel}</p>
                        <button
                            onclick="window.scrollToProject(${project.id})"
                            style="width:100%;margin-top:8px;padding:6px 12px;background-color:#1890ff;color:white;border:none;border-radius:4px;font-size:13px;font-weight:500;cursor:pointer;"
                            onmouseover="this.style.backgroundColor='#40a9ff'"
                            onmouseout="this.style.backgroundColor='#1890ff'"
                        >View Details</button>
                    </div>`;
            } else {
                const items = entries.map(({ project, locationIndex, isStatewideAtCenter }) => {
                    const color = isStatewideAtCenter ? '#faad14' : '#1890ff';
                    const hoverColor = isStatewideAtCenter ? '#ffc53d' : '#40a9ff';
                    const locLabel = isStatewideAtCenter
                        ? 'Statewide'
                        : project.coordinates.length > 1
                            ? `Location ${locationIndex + 1} of ${project.coordinates.length}`
                            : project.location;
                    return `
                        <div style="padding:8px 0;border-bottom:1px solid #f0f0f0;">
                            <h4 style="margin:0 0 4px 0;font-size:13px;color:${color};font-weight:600;">${project.name}</h4>
                            <p style="margin:2px 0;font-size:12px;"><strong>Project Lead:</strong> ${project.principal}</p>
                            <p style="margin:4px 0;font-size:12px;color:#666;"><strong>Location:</strong> ${locLabel}</p>
                            <button
                                onclick="window.scrollToProject(${project.id})"
                                style="width:100%;margin-top:6px;padding:4px 10px;background-color:${color};color:white;border:none;border-radius:4px;font-size:12px;cursor:pointer;"
                                onmouseover="this.style.backgroundColor='${hoverColor}'"
                                onmouseout="this.style.backgroundColor='${color}'"
                            >View Details</button>
                        </div>`;
                }).join('');
                popupHtml = `
                    <div style="min-width:260px;max-height:400px;overflow-y:auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
                        <h3 style="margin:0 0 12px 0;font-size:15px;color:#1890ff;font-weight:600;">${entries.length} Projects at this Location</h3>
                        <p style="margin:0 0 12px 0;font-size:12px;color:#666;"><strong>Coordinates:</strong> ${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}</p>
                        ${items}
                    </div>`;
            }

            marker.bindPopup(popupHtml, { maxWidth: 300 });
            markersRef.current.push(marker);
        });

        if (allCoords.length > 0) {
            mapRef.current.fitBounds(L.latLngBounds(allCoords), { padding: [50, 50] });
        }
    }, [projects]);

    const renderProjectCards = () =>
        projects.map(project => {
            const isExpanded = selectedProject === project.id;
            return (
                <Card
                    key={project.id}
                    id={`project-card-${project.id}`}
                    style={{
                        marginBottom: '16px',
                        cursor: 'pointer',
                        border: isExpanded ? '2px solid #1890ff' : '1px solid #d9d9d9',
                        boxShadow: isExpanded ? '0 4px 12px rgba(24, 144, 255, 0.15)' : undefined,
                    }}
                    hoverable
                    onClick={() => toggleProject(project.id)}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                            <h3 style={{ margin: 0, marginBottom: '8px' }}>
                                <EnvironmentOutlined style={{ marginRight: '8px', color: project.isStatewide ? '#faad14' : '#1890ff' }} />
                                {project.name}
                            </h3>
                            <p style={{ margin: '4px 0', color: '#666' }}><strong>Location:</strong> {project.location}</p>
                            <p style={{ margin: '4px 0', color: '#666' }}><strong>Principal:</strong> {project.principal}</p>

                            {!isExpanded && (
                                <p style={{ margin: '8px 0' }}>{project.description.substring(0, 200)}...</p>
                            )}

                            {isExpanded && (
                                <div style={{ marginTop: '16px' }}>
                                    <Divider orientation="left" style={{ margin: '16px 0' }}>Full Description</Divider>
                                    <p style={{ lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{project.description}</p>

                                    {project.photos && project.photos.length > 0 && (
                                        <>
                                            <Divider orientation="left" style={{ margin: '16px 0' }}>Project Photos</Divider>
                                            <div
                                                style={{ marginBottom: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}
                                                onClick={e => e.stopPropagation()}
                                            >
                                                <Image.PreviewGroup>
                                                    {project.photos.map((photo, idx) => (
                                                        <Image
                                                            key={idx}
                                                            src={photo}
                                                            alt={`${project.name} - Photo ${idx + 1}`}
                                                            width="100%"
                                                            height={200}
                                                            preview={{ src: photo, mask: 'Click to preview' }}
                                                            style={{ objectFit: 'cover', borderRadius: '8px', cursor: 'pointer' }}
                                                            fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23ddd' width='200' height='200'/%3E%3Ctext fill='%23999' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3EImage not found%3C/text%3E%3C/svg%3E"
                                                        />
                                                    ))}
                                                </Image.PreviewGroup>
                                            </div>
                                        </>
                                    )}

                                    <Divider orientation="left" style={{ margin: '16px 0' }}>Location Details</Divider>
                                    <p><strong>Location:</strong> {project.location}</p>
                                    {project.coordinates && project.coordinates.length > 0 && (
                                        <div>
                                            <p><strong>Number of Sites:</strong> {project.coordinates.length}</p>
                                            {project.coordinates.map((coord, idx) => (
                                                <p
                                                    key={idx}
                                                    style={{ marginLeft: '16px', fontSize: '14px', cursor: 'pointer', color: '#1890ff', textDecoration: 'underline' }}
                                                    onClick={e => flyToMarker(e, coord, project.id)}
                                                    onMouseEnter={e => e.target.style.color = '#40a9ff'}
                                                    onMouseLeave={e => e.target.style.color = '#1890ff'}
                                                >
                                                    Site {idx + 1}: {coord[0].toFixed(4)}, {coord[1].toFixed(4)} (View on Map)
                                                </p>
                                            ))}
                                        </div>
                                    )}
                                    {(!project.coordinates || project.coordinates.length === 0) && (
                                        <p><em>No specific coordinates (statewide project)</em></p>
                                    )}

                                    <Divider orientation="left" style={{ margin: '16px 0' }}>Contact Information</Divider>
                                    <p><strong>Principal Investigator:</strong> {project.principal}</p>
                                    {project.facultyWebpage && (
                                        <p>
                                            <strong>Faculty Website:</strong>{' '}
                                            <a href={project.facultyWebpage} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
                                                {project.facultyWebpage}
                                            </a>
                                        </p>
                                    )}
                                    {project.contact !== 'Not specified' && (
                                        <p>
                                            <strong>Email:</strong>{' '}
                                            <a href={`mailto:${project.contact}`} onClick={e => e.stopPropagation()}>
                                                {project.contact}
                                            </a>
                                        </p>
                                    )}

                                    <Divider style={{ margin: '24px 0 16px 0' }} />
                                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                                        <Button type="primary" icon={<ArrowUpOutlined />} onClick={scrollToMapTop} size="large">
                                            Return to Map
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </Card>
            );
        });

    return (
        <>
            <div>
                <h4>
                    <EnvironmentOutlined style={{ marginRight: '8px' }} />
                    Oregon Agricultural Water Projects
                </h4>
                <p style={{ color: '#666', marginBottom: '24px' }}>
                    Click on any project card or map marker to expand and view detailed information
                    including full description, location, and contact details.
                </p>
                <Divider />
                <div
                    ref={mapDivRef}
                    style={{ height: '500px', width: '100%', marginBottom: '24px', border: '2px solid #d9d9d9', borderRadius: '8px', zIndex: 1 }}
                />
                <Divider orientation="left">Project List</Divider>
                {renderProjectCards()}
            </div>
        </>
    );
};

export default AgTapProjects;
