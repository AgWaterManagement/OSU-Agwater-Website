import { useState, useEffect, useRef, useMemo } from 'react';
import { Input, Select, TreeSelect, Typography, Space, Tag, Checkbox, Divider, Spin, Radio } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import * as d3 from 'd3';

const { Title, Text } = Typography;

const TYPE_COLORS = {
    'Funding Partner': '#1890ff',
    'Organizational Partners': '#52c41a',
    'Municipal and Agency': '#faad14',
    'Community Groups': '#eb2f96',
    'Partners and Collaborators': '#722ed1',
    'Center leads': '#fa541c',
    'Organization': '#8c8c8c',
};

const AgSNA = () => {
    const [data, setData] = useState({ nodes: [], links: [] });
    const [loading, setLoading] = useState(true);
    const [keywordLoading, setKeywordLoading] = useState(false);
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    const [keywords, setKeywords] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [visualizationMode, setVisualizationMode] = useState('force-directed');

    const [selectedTypes, setSelectedTypes] = useState([]);
    const [selectedKeyword, setSelectedKeyword] = useState(null);
    const [showAllLabels, setShowAllLabels] = useState(false);
    const [hoveredNode, setHoveredNode] = useState(null);
    const [selectedNode, setSelectedNode] = useState(null);
    const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });

    const canvasRef = useRef(null);
    const svgRef = useRef(null);
    const interactionRef = useRef({
        isPanning: false,
        draggedNode: null,
        moved: false,
        lastPointer: { x: 0, y: 0 }
    });
    const simulationRef = useRef(null);

    const width = 1200;
    const height = 800;
    const isFetching = loading || keywordLoading;


    // Load keyword dictionary once
    useEffect(() => {
        const keywordsJsonUrl = 'https://agwater.org:5556/json?path=ag_sna&file=agSNA_keywords';
        setKeywordLoading(true);

        fetch(keywordsJsonUrl, {
            headers: {
                //'Content-Type': 'application/json',
                //'Accept': 'application/json',
                //'X-API-Key': 'agwater-web-app'
            }
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Response status: ${response.status}`);
                }
                return response.json();
            })
            .then(json => {
                if (json.success !== true || !json.data) {
                    throw new Error('Invalid keyword response format');
                }

                const keywordDictionary = json.data && typeof json.data === 'object' && !Array.isArray(json.data)
                    ? json.data
                    : {};

                setKeywords(keywordDictionary);
            })
            .catch(err => console.error('Error loading keyword JSON:', err))
            .finally(() => setKeywordLoading(false));
    }, []);

    // Load network JSON data for selected keyword category
    useEffect(() => {

        const kw = selectedKeyword ? selectedKeyword.split('::')[1] : null; // Extract keyword from "Category::Keyword" format
        const selectedFile = 'Keyword_' + kw || 'default'.replace(/[:/\\]/g, '_'); // Sanitize filename
        const networkJsonUrl = `https://agwater.org:5556/json?path=ag_sna|networks&file=${encodeURIComponent(selectedFile)}`;

        setLoading(true);
        fetch(networkJsonUrl, {
            headers: {
                //'Content-Type': 'application/json',
                //'Accept': 'application/json',
                //'X-API-Key': 'agwater-web-app'
            }
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Response status: ${response.status}`);
                }
                return response.json();
            })
            .then(json => {
                if (json.success !== true || !json.data) {
                    throw new Error('Invalid response format');
                }
                setData({
                    nodes: Array.isArray(json.data.nodes) ? json.data.nodes : [],
                    links: Array.isArray(json.data.links) ? json.data.links : [],
                });
            })
            .catch(err => {
                console.error('Error loading network JSON:', err);
                setData({ nodes: [], links: [] });
            })
            .finally(() => setLoading(false));
    }, [selectedKeyword]);

    // Process data into nodes and edges with D3 force simulation
    useEffect(() => {
        if (data.nodes.length === 0 || data.links.length === 0) return;

        const nodeMap = new Map();
        const edgeList = [];

        data.nodes.forEach((node) => {
            const id = typeof node?.id === 'string' ? node.id.trim() : '';
            if (!id) return;

            nodeMap.set(id, {
                id,
                label: id,
                link: typeof node?.link === 'string' ? node.link : null,
                connections: 0,
            });
        });

        data.links.forEach((link) => {
            const source = typeof link?.source === 'string' ? link.source.trim() : '';
            const target = typeof link?.target === 'string' ? link.target.trim() : '';
            const type = typeof link?.type === 'string' && link.type.trim() ? link.type.trim() : 'Partnership';

            if (!source || !target) return;

            if (!nodeMap.has(source)) {
                nodeMap.set(source, {
                    id: source,
                    label: source,
                    link: null,
                    connections: 0,
                });
            }
            if (!nodeMap.has(target)) {
                nodeMap.set(target, {
                    id: target,
                    label: target,
                    link: null,
                    connections: 0,
                });
            }

            nodeMap.get(source).connections++;
            nodeMap.get(target).connections++;

            edgeList.push({
                source,
                target,
                type,
                id: `${source}-${target}`,
            });
        });

        // Create nodes array with radius based on connections
        const nodeList = Array.from(nodeMap.values()).map(node => ({
            ...node,
            radius: Math.min(5 + node.connections * 0.5, 20),
        }));

        setNodes(nodeList);
        setEdges(edgeList);

        // Create D3 force simulation
        const simulation = d3.forceSimulation(nodeList)
            .force('link', d3.forceLink(edgeList)
                .id(d => d.id)
                .distance(500)  // 100
                .strength(1))   // 0.3
            .force('charge', d3.forceManyBody()
                .strength(-500))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide()
                .radius(d => d.radius + 5))
            .force('x', d3.forceX(width / 2).strength(0.1))
            .force('y', d3.forceY(height / 2).strength(0.1));

        simulation.on('tick', () => {
            setNodes([...nodeList]);
        });

        simulationRef.current = simulation;

        return () => {
            simulation.stop();
        };
    }, [data, width, height]);

    // Get unique types
    const partnerTypes = useMemo(() => {
        return [...new Set(edges.map(e => e.type).filter(Boolean))];
    }, [edges]);

    const keywordTreeData = useMemo(() => {
        return Object.entries(keywords).map(([category, keywords]) => ({
            title: category,
            value: category,
            key: category,
            selectable: false,
            children: Array.isArray(keywords)
                ? keywords.map((keyword) => ({
                    title: keyword,
                    value: `${category}::${keyword}`,
                    key: `${category}::${keyword}`,
                    selectable: true,
                }))
                : [],
        }));
    }, [keywords]);

    // Filter nodes and edges
    const filteredData = useMemo(() => {
        let filteredNodes = nodes;
        let filteredEdges = edges;

        // Helper to get ID from source/target (handles both string and object)
        const getIdFromRef = (ref) => (typeof ref === 'object' ? ref.id : ref);

        // Filter by search term
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            const matchingNodeIds = new Set(
                nodes.filter(n => n.label.toLowerCase().includes(term)).map(n => n.id)
            );

            filteredNodes = nodes.filter(n => matchingNodeIds.has(n.id));
            filteredEdges = edges.filter(e =>
                matchingNodeIds.has(getIdFromRef(e.source)) || matchingNodeIds.has(getIdFromRef(e.target))
            );

            // Include connected nodes
            filteredEdges.forEach(e => {
                matchingNodeIds.add(getIdFromRef(e.source));
                matchingNodeIds.add(getIdFromRef(e.target));
            });

            filteredNodes = nodes.filter(n => matchingNodeIds.has(n.id));
        }

        return { nodes: filteredNodes, edges: filteredEdges };
    }, [nodes, edges, searchTerm]);

    const toWorldCoordinates = (clientX, clientY) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };

        const rect = canvas.getBoundingClientRect();
        const x = (clientX - rect.left - transform.x) / transform.scale;
        const y = (clientY - rect.top - transform.y) / transform.scale;
        return { x, y };
    };

    const findNodeAtPoint = (worldX, worldY) => {
        for (let index = filteredData.nodes.length - 1; index >= 0; index -= 1) {
            const node = filteredData.nodes[index];
            if (node.x === undefined || node.y === undefined) continue;
            const dx = worldX - node.x;
            const dy = worldY - node.y;
            const radius = node.radius || 5;
            if ((dx * dx) + (dy * dy) <= radius * radius) {
                return node;
            }
        }
        return null;
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || visualizationMode !== 'force-directed') return;

        const context = canvas.getContext('2d');
        if (!context) return;

        const rect = canvas.getBoundingClientRect();
        const ratio = window.devicePixelRatio || 1;
        canvas.width = Math.floor(rect.width * ratio);
        canvas.height = Math.floor(rect.height * ratio);
        context.setTransform(ratio, 0, 0, ratio, 0, 0);

        context.clearRect(0, 0, rect.width, rect.height);
        context.save();
        context.translate(transform.x, transform.y);
        context.scale(transform.scale, transform.scale);

        filteredData.edges.forEach((edge) => {
            const source = typeof edge.source === 'object'
                ? edge.source
                : filteredData.nodes.find((node) => node.id === edge.source);
            const target = typeof edge.target === 'object'
                ? edge.target
                : filteredData.nodes.find((node) => node.id === edge.target);

            if (!source || !target || source.x === undefined || target.x === undefined) return;

            const sourceId = source.id || edge.source;
            const targetId = target.id || edge.target;
            const isHighlighted =
                selectedNode === sourceId ||
                selectedNode === targetId ||
                hoveredNode === sourceId ||
                hoveredNode === targetId;

            context.beginPath();
            context.moveTo(source.x, source.y);
            context.lineTo(target.x, target.y);
            context.strokeStyle = TYPE_COLORS[edge.type] || '#ccc';
            context.lineWidth = isHighlighted ? 2 : 1;
            context.globalAlpha = isHighlighted ? 0.8 : 0.3;
            context.stroke();
            context.globalAlpha = 1;
        });

        filteredData.nodes.forEach((node) => {
            if (node.x === undefined || node.y === undefined) return;

            const isHighlighted = selectedNode === node.id || hoveredNode === node.id;
            const getIdFromRef = (ref) => (typeof ref === 'object' ? ref.id : ref);
            const isConnected = selectedNode && filteredData.edges.some((edge) =>
                (getIdFromRef(edge.source) === selectedNode && getIdFromRef(edge.target) === node.id) ||
                (getIdFromRef(edge.target) === selectedNode && getIdFromRef(edge.source) === node.id)
            );

            context.beginPath();
            context.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
            context.fillStyle = isHighlighted ? '#ff4d4f' : (isConnected ? '#1890ff' : '#69c0ff');
            context.globalAlpha = selectedNode && !isHighlighted && !isConnected ? 0.3 : 1;
            context.fill();
            context.globalAlpha = 1;
            context.strokeStyle = isHighlighted ? '#cf1322' : '#fff';
            context.lineWidth = isHighlighted ? 3 : 2;
            context.stroke();

            if (showAllLabels || isHighlighted || node.connections > 10) {
                context.fillStyle = '#fff';
                context.font = `${isHighlighted ? 'bold' : 'normal'} 12px sans-serif`;
                context.textAlign = 'center';
                const label = node.label.length > 30 ? `${node.label.substring(0, 30)}...` : node.label;
                context.fillText(label, node.x, node.y + node.radius + 12);
            }
        });

        context.restore();
    }, [filteredData, hoveredNode, selectedNode, showAllLabels, transform, visualizationMode]);

    const handleCanvasMouseDown = (event) => {
        const world = toWorldCoordinates(event.clientX, event.clientY);
        const node = findNodeAtPoint(world.x, world.y);

        interactionRef.current.moved = false;
        interactionRef.current.lastPointer = { x: event.clientX, y: event.clientY };

        if (node) {
            interactionRef.current.draggedNode = node;
            if (simulationRef.current) {
                simulationRef.current.alphaTarget(0.3).restart();
            }
            node.fx = world.x;
            node.fy = world.y;
        } else {
            interactionRef.current.isPanning = true;
        }
    };

    const handleCanvasMouseMove = (event) => {
        const world = toWorldCoordinates(event.clientX, event.clientY);
        const hovered = findNodeAtPoint(world.x, world.y);
        setHoveredNode(hovered ? hovered.id : null);

        const last = interactionRef.current.lastPointer;
        const deltaX = event.clientX - last.x;
        const deltaY = event.clientY - last.y;

        if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
            interactionRef.current.moved = true;
        }

        if (interactionRef.current.draggedNode) {
            interactionRef.current.draggedNode.fx = world.x;
            interactionRef.current.draggedNode.fy = world.y;
        } else if (interactionRef.current.isPanning) {
            setTransform((current) => ({
                ...current,
                x: current.x + deltaX,
                y: current.y + deltaY,
            }));
        }

        interactionRef.current.lastPointer = { x: event.clientX, y: event.clientY };
    };

    const handleCanvasMouseUp = () => {
        if (interactionRef.current.draggedNode) {
            interactionRef.current.draggedNode.fx = null;
            interactionRef.current.draggedNode.fy = null;
            if (simulationRef.current) {
                simulationRef.current.alphaTarget(0);
            }

            if (!interactionRef.current.moved) {
                handleNodeClick(interactionRef.current.draggedNode);
            }
        }

        interactionRef.current.draggedNode = null;
        interactionRef.current.isPanning = false;
    };

    const handleCanvasMouseLeave = () => {
        setHoveredNode(null);
        handleCanvasMouseUp();
    };

    const handleCanvasWheel = (event) => {
        event.preventDefault();

        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const pointerX = event.clientX - rect.left;
        const pointerY = event.clientY - rect.top;

        const scaleFactor = event.deltaY < 0 ? 1.1 : 0.9;

        setTransform((current) => {
            const nextScale = Math.min(5, Math.max(0.1, current.scale * scaleFactor));
            const worldX = (pointerX - current.x) / current.scale;
            const worldY = (pointerY - current.y) / current.scale;

            return {
                x: pointerX - worldX * nextScale,
                y: pointerY - worldY * nextScale,
                scale: nextScale,
            };
        });
    };

    const handleNodeClick = (node) => {
        setSelectedNode(node.id === selectedNode ? null : node.id);
    };

    // Render hierarchical bundling when in that mode
    useEffect(() => {
        if (visualizationMode !== 'hierarchical') return;

        const svg = svgRef.current;
        if (!svg || filteredData.nodes.length === 0) return;

        const width = 1200;
        const height = 800;
        const radius = Math.min(width, height) / 2 - 100;

        // Clear previous content
        d3.select(svg).selectAll('*').remove();

        const svgElement = d3.select(svg)
            .attr('width', width)
            .attr('height', height)
            .attr('viewBox', [-width / 2, -height / 2, width, height])
            .attr('style', 'max-width: 100%; height: auto;');

        const g = svgElement.append('g');

        // Create hierarchical data from nodes grouped by connections
        const nodesByGroup = filteredData.nodes.reduce((acc, node) => {
            const group = node.connections > 10 ? 'Hub' : node.connections > 3 ? 'Active' : 'Connected';
            if (!acc[group]) acc[group] = [];
            acc[group].push({ name: node.id, id: node.id });
            return acc;
        }, {});

        const hierarchyData = {
            name: 'root',
            children: Object.entries(nodesByGroup).map(([type, members]) => ({
                name: type,
                children: members
            }))
        };

        if (!hierarchyData.children || hierarchyData.children.length === 0) return;

        // Create cluster layout
        const cluster = d3.cluster().size([2 * Math.PI, radius]);
        const hierarchy = d3.hierarchy(hierarchyData)
            .sort((a, b) => d3.ascending(a.data.name, b.data.name));
        const root = cluster(hierarchy);
        const leaves = root.leaves();

        // Create node position map
        const nodePositions = new Map();
        leaves.forEach(leaf => {
            nodePositions.set(leaf.data.id, {
                x: leaf.y * Math.cos(leaf.x - Math.PI / 2),
                y: leaf.y * Math.sin(leaf.x - Math.PI / 2),
                angle: leaf.x
            });
        });

        // Draw edges (links) with bundling
        g.append('g')
            .selectAll('path')
            .data(filteredData.edges)
            .join('path')
            .attr('d', (edge) => {
                const source = nodePositions.get(edge.source);
                const target = nodePositions.get(edge.target);

                if (!source || !target) return '';

                const sourceAngle = source.angle;
                const targetAngle = target.angle;

                // Create curved path
                const midAngle = (sourceAngle + targetAngle) / 2;
                const midRadius = radius * 0.5;

                return `M${source.x},${source.y}Q${midRadius * Math.cos(midAngle)},${midRadius * Math.sin(midAngle)},${target.x},${target.y}`;
            })
            .attr('fill', 'none')
            .attr('stroke', (edge) => TYPE_COLORS[edge.type] || '#ccc')
            .attr('stroke-width', (edge) => selectedNode && (selectedNode === edge.source || selectedNode === edge.target) ? 2 : 1)
            .attr('opacity', (edge) => selectedNode && (selectedNode === edge.source || selectedNode === edge.target) ? 0.8 : 0.3)
            .attr('stroke-linecap', 'round');

        // Draw nodes
        g.append('g')
            .selectAll('circle')
            .data(leaves)
            .join('circle')
            .attr('cx', (d) => nodePositions.get(d.data.id).x)
            .attr('cy', (d) => nodePositions.get(d.data.id).y)
            .attr('r', 5)
            .attr('fill', (d) => {
                if (selectedNode === d.data.id) return '#ff4d4f';
                const isConnected = filteredData.edges.some(e =>
                    (e.source === selectedNode && e.target === d.data.id) ||
                    (e.target === selectedNode && e.source === d.data.id)
                );
                return isConnected ? '#1890ff' : '#69c0ff';
            })
            .attr('stroke', (d) => selectedNode === d.data.id ? '#cf1322' : '#fff')
            .attr('stroke-width', (d) => selectedNode === d.data.id ? 3 : 2)
            .on('click', (event, d) => {
                event.stopPropagation();
                setSelectedNode(d.data.id === selectedNode ? null : d.data.id);
            })
            .on('mouseenter', (event, d) => {
                setHoveredNode(d.data.id);
            })
            .on('mouseleave', () => {
                setHoveredNode(null);
            })
            .style('cursor', 'pointer');

        // Draw labels
        g.append('g')
            .selectAll('text')
            .data(leaves)
            .join('text')
            .attr('x', (d) => nodePositions.get(d.data.id).x)
            .attr('y', (d) => nodePositions.get(d.data.id).y + 20)
            .attr('text-anchor', 'middle')
            .attr('font-size', '11px')
            .attr('fill', '#fff')
            .attr('font-weight', (d) => selectedNode === d.data.id || hoveredNode === d.data.id ? 'bold' : 'normal')
            .attr('opacity', (d) => showAllLabels || selectedNode === d.data.id || hoveredNode === d.data.id ? 1 : 0.7)
            .text((d) => {
                const label = d.data.id;
                return label.length > 20 ? `${label.substring(0, 20)}...` : label;
            });

        // Add title for legend
        svgElement.append('text')
            .attr('x', -width / 2 + 10)
            .attr('y', -height / 2 + 20)
            .attr('font-size', '12px')
            .attr('fill', '#666')
            .text('Hierarchical Edge Bundling - Organized by Connection Density');
    }, [filteredData, selectedNode, hoveredNode, showAllLabels, visualizationMode]);

    return (
        <div style={{ padding: '4px' }}>
            <Title level={2}>Oregon Agricultural Network Analysis</Title>
            <span>
                Interactive network diagram showing organizational partnerships and collaborations
            </span>
            <Divider />

            {/* Controls */}
            <Space wrap>
                <Input
                    placeholder="Search organizations..."
                    prefix={<SearchOutlined />}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ width: 300 }}
                    allowClear
                />

                <Select
                    mode="multiple"
                    placeholder="Filter by organization type"
                    value={selectedTypes}
                    onChange={setSelectedTypes}
                    style={{ minWidth: 300 }}
                    allowClear
                >
                    {partnerTypes.map(type => (
                        <Select.Option key={type} value={type}>
                            <Tag color={TYPE_COLORS[type] || '#gray'}>{type}</Tag>
                        </Select.Option>
                    ))}
                </Select>

                <TreeSelect
                    value={selectedKeyword}
                    treeData={keywordTreeData}
                    placeholder="Filter by keyword category"
                    onChange={(value) => setSelectedKeyword(value || null)}
                    style={{ minWidth: 300 }}
                    allowClear
                    treeDefaultExpandAll
                    showSearch
                    treeNodeFilterProp="title"
                />

                <Radio.Group 
                    value={visualizationMode} 
                    onChange={(e) => setVisualizationMode(e.target.value)}
                >
                    <Radio.Button value="force-directed">Force-Directed</Radio.Button>
                    <Radio.Button value="hierarchical">Hierarchical Edge Bundling</Radio.Button>
                </Radio.Group>

                <Checkbox
                    checked={showAllLabels}
                    onChange={(e) => setShowAllLabels(e.target.checked)}
                >
                    Show all labels
                </Checkbox>
            </Space>

            {/* Stats */}
            <Space>
                <Text strong>Nodes:</Text>
                <Text>{filteredData.nodes.length}</Text>
                <Text strong style={{ marginLeft: 16 }}>Edges:</Text>
                <Text>{filteredData.edges.length}</Text>
            </Space>

            {/* Legend */}
            <div>
                <Text strong>Organization Types:</Text>
                <div style={{ marginTop: 8 }}>
                    <Space wrap>
                        {partnerTypes.map(type => (
                            <Tag key={type} color={TYPE_COLORS[type] || '#gray'}>
                                {type}
                            </Tag>
                        ))}
                    </Space>
                </div>
            </div>

            {/* Network Diagram */}
            <div
                style={{
                    width: '100%',
                    height: 800,
                    border: '1px solid #d9d9d9',
                    borderRadius: 4,
                    overflow: 'hidden',
                    cursor: 'grab',
                    position: 'relative',
                }}
            >
                {isFetching && (
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(0, 0, 0, 0.45)',
                            zIndex: 10,
                            borderRadius: 4,
                            gap: 12,
                        }}
                    >
                        <Spin size="large" />
                        <span style={{ color: '#fff', fontSize: 14 }}>Loading network data…</span>
                    </div>
                )}

                {visualizationMode === 'force-directed' ? (
                    <canvas
                        ref={canvasRef}
                        width={width}
                        height={height}
                        onMouseDown={handleCanvasMouseDown}
                        onMouseMove={handleCanvasMouseMove}
                        onMouseUp={handleCanvasMouseUp}
                        onMouseLeave={handleCanvasMouseLeave}
                        onWheel={handleCanvasWheel}
                        style={{ width: '100%', height: '100%', userSelect: 'none', touchAction: 'none' }}
                    />
                ) : (
                    <svg
                        ref={svgRef}
                        width={width}
                        height={height}
                        style={{ width: '100%', height: '100%', userSelect: 'none', background: '#fafafa' }}
                    />
                )}

                {/* Instructions */}
                <div
                    style={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        background: 'rgba(48, 48, 48, 0.9)',
                        padding: '8px 12px',
                        borderRadius: 4,
                        fontSize: 'md',
                    }}
                >
                    {visualizationMode === 'force-directed' ? (
                        <>
                            <div>🖱️ Drag canvas to pan</div>
                            <div>🔍 Scroll to zoom</div>
                            <div>👆 Drag nodes to reposition</div>
                            <div>👆 Click node to highlight connections</div>
                        </>
                    ) : (
                        <>
                            <div>📊 Circular hierarchical layout</div>
                            <div>👆 Click node to highlight connections</div>
                            <div>🔗 Edges bundled by proximity</div>
                            <div>Organized by connection density</div>
                        </>
                    )}
                </div>

                {/* Selected Node Info */}
                {selectedNode && (
                    <div
                        style={{
                            position: 'absolute',
                            bottom: 10,
                            left: 10,
                            background: 'rgba(255, 255, 255, 0.95)',
                            padding: '12px',
                            borderRadius: 4,
                            maxWidth: 300,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        }}
                    >
                        <Text strong>{selectedNode}</Text>
                        <div style={{ marginTop: 8 }}>
                            <Text type="secondary">
                                Connections: {filteredData.nodes.find(n => n.id === selectedNode)?.connections || 0}
                            </Text>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AgSNA;
