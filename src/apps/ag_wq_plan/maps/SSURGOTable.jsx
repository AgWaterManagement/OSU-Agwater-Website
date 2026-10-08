import { useMemo, useState } from "react";
import {
  Card,
  Col,
  Descriptions,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from "antd";

const { Title, Text } = Typography;
const { Option } = Select;

/**
 * SSURGO Soil Results
 *
 * Props
 * -----
 * soilData : object
 *     JSON object returned by the Flask SSURGO API.
 *
 * Example:
 *
 * <SSURGOTable soilData={soilData} />
 */
const SSURGOTable = ({ soilData }) => {
  const [selectedCokey, setSelectedCokey] = useState(null);
  // ------------------------------------------------------------
  // Components
  // ------------------------------------------------------------
  const components = soilData?.components || [];

  // Select the dominant component initially
  const dominantComponent = soilData?.dominant_component;
  const selectedComponent = useMemo(() => {
    if (!components.length) {
      return null;
    }
    if (selectedCokey) {
      return (
        components.find(
          component => component.cokey === selectedCokey
        ) || components[0]
      );
    }
    return (
      components.find(
        component =>
          component.cokey === dominantComponent?.cokey
      ) || components[0]
    );
  }, [
    components,
    selectedCokey,
    dominantComponent
  ]);


  // ------------------------------------------------------------
  // Helper functions
  // ------------------------------------------------------------

  const formatNumber = (
    value,
    decimals = 2
  ) => {

    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return "—";
    }

    if (typeof value !== "number") {
      return value;
    }

    return value.toFixed(decimals);
  };


  const formatDepth = (depth) => {

    if (!depth) {
      return "—";
    }

    return `${formatNumber(depth.top_cm, 0)}–${formatNumber(
      depth.bottom_cm,
      0
    )} cm`;
  };


  // ------------------------------------------------------------
  // Component table
  // ------------------------------------------------------------

  const componentColumns = [

    {
      title: "Soil Component",
      dataIndex: "name",
      key: "name",

      render: (name, record) => (
        <Space direction="vertical" size={0}>

          <Text strong>
            {name}
          </Text>

          {record.major_component && (
            <Tag color="green">
              Major Component
            </Tag>
          )}

        </Space>
      ),

      sorter: (a, b) =>
        a.name.localeCompare(b.name)
    },


    {
      title: "%",
      dataIndex: "component_percent",
      key: "component_percent",
      width: 80,

      render: value =>
        value == null
          ? "—"
          : `${formatNumber(value, 0)}%`,

      sorter: (a, b) =>
        (a.component_percent || 0) -
        (b.component_percent || 0)
    },


    {
      title: "Hydrologic Group",
      dataIndex: "hydrologic_soil_group",
      key: "hydrologic_soil_group",
      width: 130,

      render: value => {

        if (!value) {
          return "—";
        }

        return (
          <Tag color="blue">
            Group {value}
          </Tag>
        );
      }
    },


    {
      title: "Taxonomic Order",
      key: "taxorder",

      render: (_, record) =>
        record.soil_taxonomy?.order || "—"
    },


    {
      title: "Subgroup",
      key: "subgroup",

      render: (_, record) =>
        record.soil_taxonomy?.subgroup || "—"
    },


    {
      title: "Particle Size",
      key: "particle_size",

      render: (_, record) =>
        record.soil_taxonomy?.particle_size || "—"
    },


    {
      title: "Hydric",
      dataIndex: "hydric_rating",
      key: "hydric_rating",
      width: 90,

      render: value => {

        if (value === "Yes") {
          return (
            <Tag color="blue">
              Yes
            </Tag>
          );
        }

        if (value === "No") {
          return (
            <Tag>
              No
            </Tag>
          );
        }

        return "—";
      }
    },


    {
      title: "Restrictive Layer",
      key: "restrictive_layer",

      render: (_, record) => {

        const layers =
          record.restrictive_layers || [];

        if (!layers.length) {
          return "None";
        }

        return (
          <Space direction="vertical" size={0}>

            {layers.map((layer, index) => (

              <Text key={index}>

                {layer.kind || "Restriction"}

                {" @ "}

                {formatNumber(
                  layer.depth_cm,
                  0
                )}
                {" cm"}

              </Text>

            ))}

          </Space>
        );
      }
    }

  ];


  // ------------------------------------------------------------
  // Horizon table
  // ------------------------------------------------------------

  const horizonColumns = [

    {
      title: "Horizon",
      dataIndex: "name",
      key: "name",
      fixed: "left",
      width: 90,

      render: value => (
        <Text strong>
          {value || "—"}
        </Text>
      )
    },


    {
      title: "Depth",
      key: "depth",
      width: 100,

      render: (_, record) =>
        formatDepth(record.depth)
    },


    {
      title: "Texture",
      key: "texture",
      width: 220,

      render: (_, record) => {

        const texture =
          record.texture || {};

        return (
          <Space direction="vertical" size={0}>

            <Text>
              {texture.class || "—"}
            </Text>

            {texture.sand_percent != null && (
              <Text type="secondary">
                Sand: {formatNumber(
                  texture.sand_percent,
                  0
                )}%
              </Text>
            )}

            {texture.silt_percent != null && (
              <Text type="secondary">
                Silt: {formatNumber(
                  texture.silt_percent,
                  0
                )}%
              </Text>
            )}

            {texture.clay_percent != null && (
              <Text type="secondary">
                Clay: {formatNumber(
                  texture.clay_percent,
                  0
                )}%
              </Text>
            )}

          </Space>
        );
      }
    },


    {
      title: "Sand %",
      key: "sand",
      width: 90,

      render: (_, record) =>
        formatNumber(
          record.texture?.sand_percent,
          1
        )
    },


    {
      title: "Silt %",
      key: "silt",
      width: 90,

      render: (_, record) =>
        formatNumber(
          record.texture?.silt_percent,
          1
        )
    },


    {
      title: "Clay %",
      key: "clay",
      width: 90,

      render: (_, record) =>
        formatNumber(
          record.texture?.clay_percent,
          1
        )
    },


    {
      title: "Field Capacity %",
      key: "field_capacity",
      width: 130,

      render: (_, record) =>
        formatNumber(
          record.water?.field_capacity_percent,
          1
        )
    },


    {
      title: "Wilting Point %",
      key: "wilting_point",
      width: 130,

      render: (_, record) =>
        formatNumber(
          record.water?.wilting_point_percent,
          1
        )
    },


    {
      title: "AWC",
      key: "awc",
      width: 100,

      render: (_, record) =>
        formatNumber(
          record.water?.awc_cm_per_cm,
          2
        )
    },


    {
      title: "Bulk Density",
      key: "bulk_density",
      width: 120,

      render: (_, record) =>
        formatNumber(
          record.physical?.bulk_density_g_cm3,
          2
        )
    },


    {
      title: "Ksat",
      key: "ksat",
      width: 100,

      render: (_, record) =>
        formatNumber(
          record.physical?.ksat_um_sec,
          2
        )
    },


    {
      title: "Organic Matter %",
      key: "organic_matter",
      width: 130,

      render: (_, record) =>
        formatNumber(
          record.physical?.organic_matter_percent,
          1
        )
    },


    {
      title: "pH",
      key: "ph",
      width: 80,

      render: (_, record) =>
        formatNumber(
          record.physical?.ph,
          1
        )
    },


    {
      title: "CEC",
      key: "cec",
      width: 100,

      render: (_, record) =>
        formatNumber(
          record.physical?.cec_meq_100g,
          1
        )
    },


    {
      title: "K Factor",
      key: "kwfact",
      width: 100,

      render: (_, record) =>
        formatNumber(
          record.erodibility?.kw_factor,
          2
        )
    }

  ];


  // ------------------------------------------------------------
  // No data
  // ------------------------------------------------------------

  if (!soilData || !soilData.found) {

    return (
      <Card>
        <Text>
          No SSURGO soil information was found
          for this location.
        </Text>
      </Card>
    );
  }


  // ------------------------------------------------------------
  // Render
  // ------------------------------------------------------------

  return (

    <div>

      {/* ======================================================
          MAP UNIT SUMMARY
          ====================================================== */}

      <Card
        title="SSURGO Soil Information"
        style={{ marginBottom: 16 }}
      >

        <Row gutter={[16, 16]}>

          <Col xs={24} md={12} lg={8}>

            <Statistic
              title="Map Unit"
              value={
                soilData.map_unit?.symbol || "—"
              }
            />

            <Text type="secondary">
              {soilData.map_unit?.name}
            </Text>

          </Col>


          <Col xs={12} md={6} lg={4}>

            <Statistic
              title="MUKEY"
              value={
                soilData.map_unit?.mukey || "—"
              }
            />

          </Col>


          <Col xs={12} md={6} lg={4}>

            <Statistic
              title="Components"
              value={components.length}
            />

          </Col>


          <Col xs={12} md={6} lg={4}>

            <Statistic
              title="Latitude"
              value={
                formatNumber(
                  soilData.location?.latitude,
                  5
                )
              }
            />

          </Col>


          <Col xs={12} md={6} lg={4}>

            <Statistic
              title="Longitude"
              value={
                formatNumber(
                  soilData.location?.longitude,
                  5
                )
              }
            />

          </Col>

        </Row>


        <Descriptions
          bordered
          size="small"
          column={{
            xs: 1,
            sm: 2,
            md: 3
          }}
          style={{ marginTop: 20 }}
        >

          <Descriptions.Item label="Map Unit">
            {soilData.map_unit?.name || "—"}
          </Descriptions.Item>

          <Descriptions.Item label="Map Unit Symbol">
            {soilData.map_unit?.symbol || "—"}
          </Descriptions.Item>

          <Descriptions.Item label="National Symbol">
            {soilData.map_unit?.national_symbol || "—"}
          </Descriptions.Item>

          <Descriptions.Item label="Map Unit Kind">
            {soilData.map_unit?.kind || "—"}
          </Descriptions.Item>

          <Descriptions.Item label="Latitude">
            {formatNumber(
              soilData.location?.latitude,
              5
            )}
          </Descriptions.Item>

          <Descriptions.Item label="Longitude">
            {formatNumber(
              soilData.location?.longitude,
              5
            )}
          </Descriptions.Item>

        </Descriptions>

      </Card>


      {/* ======================================================
          COMPONENT TABLE
          ====================================================== */}

      <Card
        title="Soil Components"
        style={{ marginBottom: 16 }}
      >

        <Table
          rowKey="cokey"
          columns={componentColumns}
          dataSource={components}
          pagination={false}
          size="small"
          scroll={{ x: 1200 }}

          rowClassName={record => {

            if (
              record.cokey ===
              selectedComponent?.cokey
            ) {
              return "selected-soil-component";
            }

            return "";
          }}

          onRow={record => ({

            onClick: () => {

              setSelectedCokey(
                record.cokey
              );

            },

            style: {
              cursor: "pointer"
            }

          })}

        />

      </Card>


      {/* ======================================================
          SELECTED COMPONENT
          ====================================================== */}

      {selectedComponent && (

        <Card
          title={
            <Space>

              <span>
                Soil Horizons:
              </span>

              <Text strong>
                {selectedComponent.name}
              </Text>

              {selectedComponent.major_component && (
                <Tag color="green">
                  Major Component
                </Tag>
              )}

            </Space>
          }

          style={{
            marginBottom: 16
          }}
        >

          {/* Component selector */}

          <Space
            style={{
              marginBottom: 16
            }}
          >

            <Text>
              Select soil component:
            </Text>

            <Select
              value={selectedComponent.cokey}
              style={{ minWidth: 250 }}

              onChange={value =>
                setSelectedCokey(value)
              }
            >

              {components.map(component => (

                <Option
                  key={component.cokey}
                  value={component.cokey}
                >

                  {component.name}
                  {" ("}
                  {formatNumber(
                    component.component_percent,
                    0
                  )}
                  {"%)"}

                </Option>

              ))}

            </Select>

          </Space>


          {/* Component information */}

          <Descriptions
            bordered
            size="small"
            column={{
              xs: 1,
              sm: 2,
              md: 3,
              lg: 4
            }}
            style={{
              marginBottom: 16
            }}
          >

            <Descriptions.Item label="Component">
              {selectedComponent.name}
            </Descriptions.Item>

            <Descriptions.Item label="Component %">
              {formatNumber(
                selectedComponent.component_percent,
                0
              )}%
            </Descriptions.Item>

            <Descriptions.Item label="Hydrologic Group">
              <Tag color="blue">
                Group{" "}
                {selectedComponent.hydrologic_soil_group}
              </Tag>
            </Descriptions.Item>

            <Descriptions.Item label="Hydric Rating">
              {selectedComponent.hydric_rating}
            </Descriptions.Item>

            <Descriptions.Item label="Taxonomic Order">
              {selectedComponent.soil_taxonomy?.order || "—"}
            </Descriptions.Item>

            <Descriptions.Item label="Subgroup">
              {selectedComponent.soil_taxonomy?.subgroup || "—"}
            </Descriptions.Item>

            <Descriptions.Item label="Particle Size">
              {selectedComponent.soil_taxonomy?.particle_size || "—"}
            </Descriptions.Item>

          </Descriptions>


          {/* ==================================================
              RESTRICTIVE LAYERS
              ================================================== */}

          {selectedComponent.restrictive_layers?.length > 0 && (

            <Card
              type="inner"
              title="Restrictive Layers"
              style={{
                marginBottom: 16
              }}
            >

              <Table
                rowKey={(record, index) =>
                  `${record.kind}-${index}`
                }

                size="small"
                pagination={false}

                dataSource={
                  selectedComponent.restrictive_layers
                }

                columns={[
                  {
                    title: "Type",
                    dataIndex: "kind",
                    key: "kind"
                  },

                  {
                    title: "Depth (cm)",
                    dataIndex: "depth_cm",
                    key: "depth_cm",

                    render: value =>
                      formatNumber(value, 0)
                  },

                  {
                    title: "Hardness",
                    dataIndex: "hardness",
                    key: "hardness"
                  }
                ]}
              />

            </Card>

          )}


          {/* ==================================================
              HORIZON TABLE
              ================================================== */}

          <Table
            rowKey={(record, index) =>
              `${record.name}-${index}`
            }

            columns={horizonColumns}

            dataSource={
              selectedComponent.horizons || []
            }

            pagination={false}

            size="small"

            bordered

            scroll={{
              x: 1800
            }}

            expandable={{
              expandedRowRender: record => (

                <Descriptions
                  bordered
                  size="small"
                  column={3}
                >

                  <Descriptions.Item label="Horizon">
                    {record.name}
                  </Descriptions.Item>

                  <Descriptions.Item label="Depth">
                    {formatDepth(record.depth)}
                  </Descriptions.Item>

                  <Descriptions.Item label="Texture">
                    {record.texture?.class || "—"}
                  </Descriptions.Item>

                  <Descriptions.Item label="Field Capacity">
                    {formatNumber(
                      record.water?.field_capacity_percent,
                      1
                    )}%
                  </Descriptions.Item>

                  <Descriptions.Item label="Wilting Point">
                    {formatNumber(
                      record.water?.wilting_point_percent,
                      1
                    )}%
                  </Descriptions.Item>

                  <Descriptions.Item label="AWC">
                    {formatNumber(
                      record.water?.awc_cm_per_cm,
                      2
                    )} cm/cm
                  </Descriptions.Item>

                  <Descriptions.Item label="Saturated Water">
                    {formatNumber(
                      record.water?.saturated_water_percent,
                      1
                    )}%
                  </Descriptions.Item>

                  <Descriptions.Item label="Bulk Density">
                    {formatNumber(
                      record.physical?.bulk_density_g_cm3,
                      2
                    )} g/cm³
                  </Descriptions.Item>

                  <Descriptions.Item label="Ksat">
                    {formatNumber(
                      record.physical?.ksat_um_sec,
                      2
                    )} μm/s
                  </Descriptions.Item>

                  <Descriptions.Item label="Organic Matter">
                    {formatNumber(
                      record.physical?.organic_matter_percent,
                      1
                    )}%
                  </Descriptions.Item>

                  <Descriptions.Item label="pH">
                    {formatNumber(
                      record.physical?.ph,
                      1
                    )}
                  </Descriptions.Item>

                  <Descriptions.Item label="CEC">
                    {formatNumber(
                      record.physical?.cec_meq_100g,
                      1
                    )}
                  </Descriptions.Item>

                  <Descriptions.Item label="Linear Extensibility">
                    {formatNumber(
                      record.physical?.linear_extensibility_percent,
                      1
                    )}%
                  </Descriptions.Item>

                  <Descriptions.Item label="K Factor">
                    {formatNumber(
                      record.erodibility?.kw_factor,
                      2
                    )}
                  </Descriptions.Item>

                  <Descriptions.Item label="KF Factor">
                    {formatNumber(
                      record.erodibility?.kf_factor,
                      2
                    )}
                  </Descriptions.Item>

                </Descriptions>

              ),

              rowExpandable: record =>
                record != null

            }}

          />

        </Card>

      )}

    </div>
  );
};


export default SSURGOTable;
