// Lightweight GML2 -> GeoJSON converter for MapServer WFS 1.0.0 GetFeature responses.
// MapServer only advertises GML2 as a GetFeature result format for the WOTUS test
// map file (see wfs_getfeature_formatlist), so the browser must do this conversion
// itself before handing geometry to Leaflet's GeoJSON layer.

function localName(node) {
  return node.localName || node.nodeName.split(":").pop();
}

function childrenByLocalName(el, name) {
  return Array.from(el.children).filter((child) => localName(child) === name);
}

function firstChildByLocalName(el, name) {
  return childrenByLocalName(el, name)[0] || null;
}

function parseCoordinates(text) {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((pair) => pair.split(",").map(Number));
}

function parseLinearRing(linearRingEl) {
  const coordsEl = linearRingEl && firstChildByLocalName(linearRingEl, "coordinates");
  return coordsEl ? parseCoordinates(coordsEl.textContent) : [];
}

function parsePolygon(polygonEl) {
  const outerBoundary = firstChildByLocalName(polygonEl, "outerBoundaryIs");
  const outerRing = parseLinearRing(outerBoundary && firstChildByLocalName(outerBoundary, "LinearRing"));
  const holes = childrenByLocalName(polygonEl, "innerBoundaryIs").map((inner) =>
    parseLinearRing(firstChildByLocalName(inner, "LinearRing"))
  );
  return [outerRing, ...holes];
}

function parseGeometry(geometryEl) {
  const polygonEl = firstChildByLocalName(geometryEl, "Polygon");
  if (polygonEl) {
    return { type: "Polygon", coordinates: parsePolygon(polygonEl) };
  }

  const multiPolygonEl = firstChildByLocalName(geometryEl, "MultiPolygon");
  if (multiPolygonEl) {
    const coordinates = childrenByLocalName(multiPolygonEl, "polygonMember")
      .map((member) => firstChildByLocalName(member, "Polygon"))
      .filter(Boolean)
      .map(parsePolygon);
    return { type: "MultiPolygon", coordinates };
  }

  return null;
}

function isGeometryElement(el) {
  return Boolean(firstChildByLocalName(el, "Polygon") || firstChildByLocalName(el, "MultiPolygon"));
}

function parseFeatureMember(featureMemberEl) {
  const featureEl = featureMemberEl.children[0];
  if (!featureEl) return null;

  const properties = {};
  let geometry = null;

  for (const child of Array.from(featureEl.children)) {
    const name = localName(child);
    if (name === "boundedBy") continue;
    if (isGeometryElement(child)) {
      geometry = parseGeometry(child);
      continue;
    }
    properties[name] = child.textContent.trim();
  }

  return { type: "Feature", geometry, properties };
}

export function parseGml2FeatureCollection(xmlText) {
  const doc = new DOMParser().parseFromString(xmlText, "text/xml");

  if (doc.querySelector("parsererror")) {
    throw new Error("Failed to parse WFS response as XML");
  }

  const allElements = Array.from(doc.getElementsByTagName("*"));
  const exceptionEl = allElements.find((el) => localName(el) === "ServiceException");
  if (exceptionEl) {
    throw new Error(exceptionEl.textContent.trim());
  }

  const features = allElements
    .filter((el) => localName(el) === "featureMember")
    .map(parseFeatureMember)
    .filter((feature) => feature && feature.geometry);

  return { type: "FeatureCollection", features };
}
