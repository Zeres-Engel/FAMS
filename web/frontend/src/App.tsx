
import "./App.scss";
import AppRoutes from "./routes/AppRoutes";
import { Provider, useDispatch } from "react-redux";
import { store } from "./store/store";
import { refreshAccessToken } from "./services/authServices";
import { useEffect } from "react";
import TokenRefresher from "./components/RefreshToken/TokenRefresher";

function App() {
  return (
    <Provider store={store}>
      <TokenRefresher/>
      <AppRoutes />
    </Provider>
  );
}

export default App;
