
import { Typography, Card, Row, Col } from 'antd';
import AgWaterChat from '../../components/ag_water_chat_v2/AgWaterChat_v2';

const { Title, Paragraph, Text, Link } = Typography;

const Chat = () => (
    <div style={{ padding: '0.5em' }}>
        <div>
            <Title level={1}>Ag Water Chat v2</Title>
            <Paragraph style={{ fontStyle: 'italic' }}>The Ag Water Chat is an AI-driven chatbox that is trained using a variety of Extension and other curated information sources 
                about agriculture, water and soils in the Pacific Northwest.  Because it is AI-driven, it can sometimes produce unexpected results - 
                it is recommended you check the sources the AI uses to generate the provided response - links to these are provided at the end of each response.
            </Paragraph>

            <Paragraph style={{ fontStyle: 'italic' }}>This chat tool is similar to our existing Ag Water Chat tool, with the addition of functionality from the SmartTap data visualization and analysis platform.</Paragraph>

            <Paragraph style={{ fontStyle: 'italic' }}>
                Ask about Oregon agricultural and weather data. SmartTap will parse, fetch, validate, and visualize the
                result.
            </Paragraph>

            <Paragraph style={{ fontStyle: 'italic' }}>Note: The chat is currently in beta testing, and may not always work as expected.  If you have any issues, please contact us at
                {/* <a style={{ textDecoration: 'none' }} href="mailto:ag-water@oregonstate.edu"> agwater support</a>. */}
                <Link style={{ textDecoration: 'none' }} href="mailto:ag-water@oregonstate.edu"> AgWater Support</Link>.
            </Paragraph>
        </div>

        <div className="space-y-6">
            <Card>
            <div className="space-y-6">

                <Row gutter={16}>
                <Col xs={24} md={12}>
                    <Title level={2} className="font-display text-xl text-ink">What Ag Water Chat Does</Title>
                    <ul className="mt-3 space-y-2 text-sm text-ink/80">
                    <li>Answer plain-English questions about agricultural water use and weather</li>
                    <li>Builds charts from plain-English ag and weather questions</li>
                    <li>Shows a short explanation of the chart, plus inspectable source rows</li>
                    <li>Supports crop summaries, trends, and comparisons</li>
                    </ul>
                </Col>

                <Col xs={24} md={12}>
                    <Title level={2} className="font-display text-xl text-ink">Example Queries</Title>
                    <ul className="mt-3 space-y-2 text-sm text-ink/80">
                    <li>`How much water is needed to irrigate a field of corn in the Willamette Valley?`</li>
                    <li>`Show temperature in Corvallis for July 2026`</li>
                    <li>`What are the monthly ETa values in Hood River for the year 2025?`</li>
                    <li>`What crops are grown in Benton County?`</li>
                    </ul>
                </Col>
                </Row>


                <Title level={4} className="font-display text-lg text-ink">Disclaimer</Title>
                <Paragraph className="text-sm text-ink/80">
                    This tool is still in development and may not always provide accurate results.
                    Some issues include incomplete data coverage, classification errors where a general question is identified as a question for data to be retrieved, sensitivity to query phrasing, and potential inaccuracies in the underlying datasets.
                </Paragraph>
                <Paragraph className="text-sm text-ink/80">
                    Due to limited data coverage,
                    the available OpenET data only covers up to October 1st, 2025.
                    Queries made to the OpenET dataset after this date may not return accurate results.
                </Paragraph>
                <Paragraph className="text-sm text-ink/80">
                    It should also be noted that, in general, queries to the OpenET dataset are very sensitive to the exact phrasing of the query.
                    For instance, the query "What are the monthly ETa values for Hood River in 2025?" will operate under the assumption that the user
                    wants to gather the monthly ETa values for a reference crop called Hood River. Instead, such a query should specify that these
                    OpenET measurements are coming from in the specified city or county. For example, a better phrasing of the query would be
                    "What are the monthly ETa values in Hood River in 2025?".
                </Paragraph>
                <Paragraph className="text-sm text-ink/80">
                    Please use the tool with caution and verify the data before making any decisions based on it.
                </Paragraph>
            </div>
            </Card>
            <AgWaterChat />
        </div>
    </div>
);

export default Chat;

