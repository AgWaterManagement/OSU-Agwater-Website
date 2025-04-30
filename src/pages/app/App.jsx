

import { Refine } from "@refinedev/core";
import dataProvider from "@refinedev/simple-rest";

import AppLayout from '../layout/Layout';
//import './App.css'

const API_URL = "https://api.fake-rest.refine.dev";


const App = () => (

    <Refine dataProvider={dataProvider(API_URL)}>
        <AppLayout />;
    </Refine>
)

export default App;
