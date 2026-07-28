
import { useState } from "react";
import { Layout, Typography, Steps, Card, Checkbox, InputNumber, Select, Alert, Progress } from "antd";
const { Header, Content } = Layout;
const { Title, Paragraph } = Typography;
const regions = ["Willamette Valley", "Blue Mountains", "Coast Range", "Columbia Plateau", "East Cascades"];


function VFSGuide() {
  const [step, setStep] = useState(0);
  const [checks, setChecks] = useState({ livestock: false, invasive: false, bare: false });
  const [slope, setSlope] = useState();
  const [soil, setSoil] = useState();
  const [region, setRegion] = useState();

  const warnings = [];
  if (slope > 15) 
    warnings.push("Slope exceeds recommended maximum (15%).");
  
  if (soil === "D") 
    warnings.push("Hydrologic Soil Group D is generally unsuitable.");
  
  let status = "Enter a slope.";
  if (slope != null) {
    if (slope < 2) status = "Slope may cause ponding.";
    else if (slope <= 5) status = "Ideal slope.";
    else if (slope <= 15) status = "Acceptable.";
    else status = "Not recommended.";
  }
  return (
    <>
      <Title level={3}>Vegetated Filter Strip Planner</Title>

      <Content style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>

        <Paragraph>Interactive planner based on the uploaded draft.</Paragraph>

        <Steps current={step} items={[{ title: "Intro" }, { title: "Assessment" }, { title: "Design" }]} onChange={setStep} />

        {step === 0 && <Card title="Introduction"><Paragraph>Vegetated filter strips reduce erosion and improve water quality.</Paragraph></Card>}

        {step === 1 && <Card title="Site Assessment">
          <Checkbox checked={checks.livestock} onChange={e => setChecks({ ...checks, livestock: e.target.checked })}>Livestock present</Checkbox><br />
          <Checkbox checked={checks.invasive} onChange={e => setChecks({ ...checks, invasive: e.target.checked })}>Invasive vegetation</Checkbox><br />
          <Checkbox checked={checks.bare} onChange={e => setChecks({ ...checks, bare: e.target.checked })}>Bare soil</Checkbox>
        </Card>}

        {step === 2 && <Card title="Design Factors">
          <Paragraph>Slope (%)</Paragraph><InputNumber value={slope} onChange={setSlope} />
          <Paragraph>Soil Group</Paragraph>

          <Select style={{ width: 160 }} value={soil} onChange={setSoil} options={["A", "B", "C", "D"].map(x => ({ value: x, label: x }))} />

          <Paragraph>Region</Paragraph>

          <Select style={{ width: 220 }} value={region} onChange={setRegion} options={regions.map(r => ({ value: r, label: r }))} />

          <Progress percent={slope ? Math.min(slope * 5, 100) : 0} />

          <Alert style={{ marginTop: 16 }} type="info" message={status} />
          
          {warnings.map(w => <Alert key={w} style={{ marginTop: 8 }} type="warning" message={w} />)}
        </Card>}
      </Content>
      </>
  );
}

export default VFSGuide;