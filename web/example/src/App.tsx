import { Route, Routes } from "react-router-dom";
import { SampleList } from "./samples";
import { ConferenceSampleScreen } from "./samples/conference";
// import { EchoSample } from "./samples/echo";
import { EchoPairScreen } from "./samples/echo-pair";

export default function App() {
  return (
    <Routes>
      <Route path="/">
        <Route index element={<SampleList />} />
        {/* <Route path="echo" element={<EchoSample />} /> */}
        <Route path="echo-pair" element={<EchoPairScreen />} />
        <Route path="conference" element={<ConferenceSampleScreen />} />
      </Route>
    </Routes>
  );
}