//import PropTypes from 'prop-types';
import { Tabs } from 'antd'
import AgWaterByCounty from './ag_water_by_county/AgWaterByCounty';

const Dashboards = () => {

  const items = [
    {
      key: '1',
          label: 'Ag Water by County',
          children: <AgWaterByCounty/>
    },
  ];
  
  return (
    <>
     <Tabs defaultActiveKey="0" items={items} />;
    </>
  )};

Dashboards.propTypes = {
  //article: PropTypes.object,
}

export default Dashboards;



{/*
          <!--
          <div className="row aw-light-bg">
            <div className="col-3">
              <q-select outlined className="select aw-light-bg aw-dark-text" v-model="state" :options="stateOptions" label="State"></q-select>
          </div>
          <div className="col-3">
            <q-select outlined className="select" v-model="crop" :options="cropOptions" label="Crop"></q-select>
        </div>
        <div className="col-3">
          <q-select outlined className="select" v-model="year" :options="yearOptions" label="Year"></q-select>
      </div>
      <div className="col-3">
        <q-select outlined className="select" v-model="metric" :options="metricOptions" label="Metric"></q-select>
    </div >
        </div >
  -->
      </div >
    </div >
*/}



/*
template>

  <q-page padding className="aw-vdark-bg">


    <div className="aw-dark-bg" style="margin:0;padding:1em">
      <h6 className="aw-light-accent-text">Irrigation Water Use in the United States</h6>
      <span>John Bolte, Professor, Biological &amp; Ecological Engineering, Oregon State University</span>
      <br />
    </div>
    <div className="row">
      <br />
      <p>

        <span style="float:right;width:35%">
          <q-img src="https://agupubs.onlinelibrary.wiley.com/cms/asset/513b4de2-762d-464a-af52-8f6513464d64/wrcr26385-fig-0003-m.jpg" className="rounded-borders shadow-8" style="width:100%; margin:1em"></q-img>
          <br />
          <span style="font-size:small;margin-left:1em;">Figure from: <a href="https://doi.org/10.1029/2022WR032804">P. J. Ruess, M. Konar, N. Wanders, M. Bierkens (2022)</a></span>
        </span>
        Irrigation is vital to food and fiber production, particularly in areas that
        experience water limitations.  Irrigation is typically drawn from either surface waters
        (from rivers, lakes, or reservoirs) and groundwater (stored beneath the Earth's surface in aquifers.)
        Globally, about 43% of the world's irrigated area relies on groundwater; however, both the total amount of irrigation
        withdrawals, and the amount drawn from either surface or groundwater.
        <br />
        <br />
        Since 1890, irrigated acreage in the U.S. has expanded from less than 3 million acres to over 58 million acres in 2017. Federal, state, and local water
        development projects, along with innovations in groundwater pumping technologies, have contributed to this growth.
        Recent trends show improved efficiency in water application technologies, leading to a decline in water use per acre
        irrigated. Changing cropping patterns and regional shifts also influence irrigation practices¹.
        <br />
        <br />
        A recent analysis by Ruess, Konar, Wanders, Bierkens (2024),
        <a href="https://doi.org/10.1038/s41597-024-03244-w">
          Irrigation by crop in the Continental United States from 2008 to 2020
        </a> produced a new database of irrigation water withdrawals by crop, county, year, and water source within
        the United States. They used a <a href="https://doi.org/10.1029/2022WR032804">previously developed approach</a>
        combining crop mapping, evapotranspiration estimates, and groundwater data to develop this new dataset.
        This dataset has nearly 2.5 million data points (3,142 counties; 13 years; 3 water sources;
        and 20 crops) across the US.  An interactive viewer for this data is provided below.

      </p>
    </div>

    <hr />
    <div className="row" style="width:100%">

      <div className="col-12 col-md-6" style="height:800px">
        <div className="row" style="height:600px">
          <AWIrrigUseMap xCenter="-100.0" yCenter="39.0" zoom="4"
                     field="total_2008"
                     legendTitle="Km<sup>3</sup>/ of water used"
                     colorMap="above">
          </AWIrrigUseMap>
        </div>
      </div>

      <div className="col-12 col-md-6" style="padding-left:0.25em;">
        <div className="row aw-light-bg aw-dark-accent-text" style="height:280px">
          <div className="col-4" style="padding:0.5em">
            <h6>Irrigation Withdrawals by State</h6>
            <span>Top 20 Irrigation Water Users, Ranked by Total Withdrawals</span>
          </div>
          <div className="col-8" style="height:20em">
            <AWPlotlyChart :jsonPath="jsonIrrigWithdrawalsByState" style="width:100%;height:100%" />
          </div>
        </div>
        <div className="row aw-light-bg">
          <q-slider @update:model-value='UpdateStateChartsFromYear' v-model="year" marker-labels markers="2" :min="2008" :max="2020" :step="1" className="aw-dark-text time-slider" />
        </div>


        <!--
        <div className="row aw-light-bg">
          <div className="col-3">
            <q-select outlined className="select aw-light-bg aw-dark-text" v-model="state" :options="stateOptions" label="State"></q-select>
          </div>
          <div className="col-3">
            <q-select outlined className="select" v-model="crop" :options="cropOptions" label="Crop"></q-select>
          </div>
          <div className="col-3">
            <q-select outlined className="select" v-model="year" :options="yearOptions" label="Year"></q-select>
          </div>
          <div className="col-3">
            <q-select outlined className="select" v-model="metric" :options="metricOptions" label="Metric"></q-select>
          </div>
        </div>
        -->
      </div>
    </div>

    <div className="row">
      <h8>More Information</h8>
      (1) USDA ERS - Irrigation & Water Use. https: //www.ers.usda.gov/topics/farm-practices-management/irrigation-water-use/.
      (2) Impacts of agricultural irrigation on groundwater salinity. https: //link.springer.com/article/10.1007/s12665-018-7386-6.
      (3) Types of Agricultural Water Use | Other Uses of Water - CDC. https: //www.cdc.gov/healthywater/other/agricultural/types.html.
    </div>
  </q-page>
</template>


<script setup>
  import AWIrrigUseMap from "components/AWIrrigUseMap.vue";
  import AWPlotlyChart from "components/AWPlotlyChart.vue";
  import { onMounted, ref } from 'vue'

  const state = ref('Oregon');
  const crop = ref('All');
  const metric = ref('Total Irrigation Withdrawals')
  const year = ref(2008);
  const jsonIrrigWithdrawalsByState = ref("/articles/IrrigWaterUse/plots/IrrigWithdrawalsByState_2008.json");

  onMounted(() => {
  });

  //document.getElementById("yourDivID").scrollIntoView({
  //  behavior: "smooth", block: "start", inline: "nearest"})

  function UpdateStateChartsFromYear(year, evt) {
    jsonIrrigWithdrawalsByState.value = "/articles//IrrigWaterUse/plots/IrrigWithdrawalsByState_" + year + ".json";
  }

  function LoadScript(url, data) {
    let script = document.createElement('script');
    script.setAttribute('src', url);
    if (data)
      script.setAttribute('data-export', 'true');

    document.head.appendChild(script);
  }

  const cropOptions = ['Corn'];
  const yearOptions = [];
  for (let i = 2008; i < 2021; i++) {
    yearOptions.push(i.toFixed(0));
  }

  const metricOptions = [
    { label: "Surface Withdrawals", value: "SWW" },
    { label: "Groundwater Withdrawals", value: "GWW" },
    { label: "Total Irrigation Withdrawals", value: "TOT" },
    { label: "Growndwater Depletion", value: "GWD" }];

  const stateOptions = [
    { label: "Alabama", value: "1" },
    { label: "Alaska", value: "2" },
    { label: "Arizona", value: "4" },
    { label: "Arkansas", value: "5" },
    { label: "California", value: "6" },
    { label: "Colorado", value: "8" },
    { label: "Connecticut", value: "9" },
    { label: "Delaware", value: "10" },
    { label: "Florida", value: "12" },
    { label: "Georgia", value: "13" },
    { label: "Hawaii", value: "15" },
    { label: "Idaho", value: "16" },
    { label: "Illinois", value: "17" },
    { label: "Indiana", value: "18" },
    { label: "Iowa", value: "19" },
    { label: "Kansas", value: "20" },
    { label: "Kentucky", value: "21" },
    { label: "Louisiana", value: "22" },
    { label: "Maine", value: "23" },
    { label: "Maryland", value: "24" },
    { label: "Massachusetts", value: "25" },
    { label: "Michigan", value: "26" },
    { label: "Minnesota", value: "27" },
    { label: "Mississippi", value: "28" },
    { label: "Missouri", value: "29" },
    { label: "Montana", value: "30" },
    { label: "Nebraska", value: "31" },
    { label: "Nevada", value: "32" },
    { label: "New Hampshire", value: "33" },
    { label: "New Jersey", value: "34" },
    { label: "New Mexico", value: "35" },
    { label: "New York", value: "36" },
    { label: "North Carolina", value: "37" },
    { label: "North Dakota", value: "38" },
    { label: "Ohio", value: "39" },
    { label: "Oklahoma", value: "40" },
    { label: "Oregon", value: "41" },
    { label: "Pennsylvania", value: "42" },
    { label: "Rhode Island", value: "44" },
    { label: "South Carolina", value: "45" },
    { label: "South Dakota", value: "46" },
    { label: "Tennessee", value: "47" },
    { label: "Texas", value: "48" },
    { label: "Utah", value: "49" },
    { label: "Vermont", value: "50" },
    { label: "Virginia", value: "51" },
    { label: "Washington", value: "53" },
    { label: "West Virginia", value: "54" },
    { label: "Wisconsin", value: "55" },
    { label: "Wyoming", value: "56" }];

  const state_bboxes = [
    {
      "geoid": 1,
      "bounding_box": [-88.473227, 30.223334, -84.88908, 35.008028]
    },
    {
      "geoid": 2,
      "bounding_box": [-179.148909, 51.214183, 179.77847, 71.365162]
    },
    {
      "geoid": 4,
      "bounding_box": [-114.818267, 31.332177, -109.045223, 37.00426]
    },
    {
      "geoid": 5,
      "bounding_box": [-94.617919, 33.004106, -89.644395, 36.4996]
    },
    {
      "geoid": 6,
      "bounding_box": [-124.409591, 32.534156, -114.131211, 42.009518]
    },
    {
      "geoid": 8,
      "bounding_box": [-109.045223, 36.993076, -102.041524, 41.003444]
    },
    {
      "geoid": 9,
      "bounding_box": [-73.727775, 40.980144, -71.786994, 42.050587]
    },
    {
      "geoid": 10,
      "bounding_box": [-75.788658, 38.451013, -75.048939, 39.839007]
    },
    {
      "geoid": 12,
      "bounding_box": [-87.634938, 24.396308, -80.031362, 31.000968]
    },
    {
      "geoid": 13,
      "bounding_box": [-85.605165, 30.357851, -80.839729, 35.000659]
    },
    {
      "geoid": 15,
      "bounding_box": [-178.334698, 18.776344, -154.806773, 20.267325]
    },
    {
      "geoid": 16,
      "bounding_box": [-117.243027, 41.988057, -111.043564, 49.001146]
    },
    {
      "geoid": 17,
      "bounding_box": [-91.513079, 36.970298, -87.494756, 42.508481]
    },
    {
      "geoid": 18,
      "bounding_box": [-88.09776, 37.771742, -84.784579, 41.760592]
    },
    {
      "geoid": 19,
      "bounding_box": [-96.639704, 40.375501, -90.140061, 43.501196]
    },
    {
      "geoid": 20,
      "bounding_box": [-102.051744, 36.993076, -94.588413, 40.003162]
    },
    {
      "geoid": 21,
      "bounding_box": [-89.571509, 36.497129, -81.964971, 39.147458]
    },
    {
      "geoid": 22,
      "bounding_box": [-94.043147, 28.928609, -88.817017, 33.019457]
    },
    {
      "geoid": 23,
      "bounding_box": [-71.083924, 42.977764, -66.949895, 47.459686]
    },
    {
      "geoid": 24,
      "bounding_box": [-79.487651, 37.911717, -75.048939, 39.723043]
    },
    {
      "geoid": 25,
      "bounding_box": [-73.508142, 41.237964, -69.928393, 42.886589]
    },
    {
      "geoid": 26,
      "bounding_box": [-90.418136, 41.696118, -82.122196, 48.306007]
    },
    {
      "geoid": 27,
      "bounding_box": [-97.239209, 43.499356, -89.491739, 49.384358]
    },
    {
      "geoid": 28,
      "bounding_box": [-91.655009, 30.173943, -88.097888, 34.996052]
    },
    {
      "geoid": 29,
      "bounding_box": [-94.617919, 36.4996, -89.644395, 40.61364]
    },
    {
      "geoid": 30,
      "bounding_box": [-116.050003, 44.358219, -104.039648, 49.00139]
    },
    {
      "geoid": 31,
      "bounding_box": [-104.053514, 39.999998, -95.30829, 43.001708]
    },
    {
      "geoid": 32,
      "bounding_box": [-120.005746, 35.001857, -114.039648, 42.002207]
    },
    {
      "geoid": 33,
      "bounding_box": [-71.083924, 42.977764, -70.703921, 45.305476]
    },
    {
      "geoid": 34,
      "bounding_box": [-75.559614, 38.928519, -73.893979, 41.357423]
    },
    {
      "geoid": 35,
      "bounding_box": [-109.045223, 31.332177, -103.002565, 37.000232]
    },
    {
      "geoid": 36,
      "bounding_box": [-79.76259, 40.477399, -71.185086, 45.01585]
    },
    {
      "geoid": 37,
      "bounding_box": [-84.321869, 33.842316, -75.460621, 36.588117]
    },
    {
      "geoid": 38,
      "bounding_box": [-104.0489, 45.935054, -96.436589, 45.94545]
    },
    {
      "geoid": 39,
      "bounding_box": [-83.67529, 36.540738, -75.242266, 39.466012]
    },
    {
      "geoid": 40,
      "bounding_box": [-103.002565, 33.615833, -94.430662, 37.002206]
    },
    {
      "geoid": 41,
      "bounding_box": [-124.566244, 41.991794, -116.463262, 46.292035]
    },
    {
      "geoid": 42,
      "bounding_box": [-80.519891, 39.7198, -74.689516, 42.26986]
    },
    {
      "geoid": 44,
      "bounding_box": [-71.862772, 41.146339, -71.12057, 42.018798]
    },
    {
      "geoid": 45,
      "bounding_box": [-83.35391, 32.0346, -78.54203, 35.215402]
    },
    {
      "geoid": 46,
      "bounding_box": [-104.057698, 42.479635, -96.436589, 45.94545]
    },
    {
      "geoid": 47,
      "bounding_box": [-90.310298, 34.982972, -81.6469, 36.678118]
    },
    {
      "geoid": 48,
      "bounding_box": [-106.645646, 25.837377, -93.508292, 36.500704]
    },
    {
      "geoid": 49,
      "bounding_box": [-114.052962, 36.993076, -109.041058, 42.001567]
    },
    {
      "geoid": 50,
      "bounding_box": [-73.43774, 42.726853, -71.464555, 45.016659]
    },
    {
      "geoid": 51,
      "bounding_box": [-83.67529, 36.540738, -75.242266, 39.466012]
    },
    {
      "geoid": 53,
      "bounding_box": [-124.848974, 45.543541, -116.916071, 49.002494]
    },
    {
      "geoid": 54,
      "bounding_box": [-82.644739, 37.201483, -77.719519, 40.638801]
    },
    {
      "geoid": 55,
      "bounding_box": [-92.888114, 42.491983, -86.805415, 47.080621]
    },
    {
      "geoid": 56,
      "bounding_box": [-111.056888, 40.994746, -104.039648, 45.005904]
    }];
</script>

<style scoped>

  .select {
    margin: 0.5em;
    padding: 0.25em;
  }
</style>
*/