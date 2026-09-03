import React from "react";
import "@fontsource-variable/fraunces";
import "@fontsource/instrument-sans/400.css";
import "@fontsource/instrument-sans/500.css";
import "@fontsource/instrument-sans/600.css";
import "@fontsource/instrument-sans/700.css";
import "@fontsource/atkinson-hyperlegible/400.css";
import "@fontsource/atkinson-hyperlegible/700.css";
import { createRoot } from "react-dom/client";
import App from "./App";
import EveningShell from "./evening/EveningShell";
import PersonalEvening from "./evening/PersonalEvening";
import { BookingPage } from "./evening/BookingPage";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/adapt.css";
import "./styles/shop.css";
import "./styles/services.css";
import "./styles/app.css";
import "./styles/landing.css";
import "./styles/judge.css";
import "./styles/evening.css";
import "./styles/calm.css";

const path = location.pathname.replace(/\/+$/, "");
const experience = path === "/cinema" ? <BookingPage site="cinema" />
  : path === "/restaurant" ? <BookingPage site="restaurant" />
  : path === "" || path === "/personal" ? <PersonalEvening />
  : path === "/guided" ? <EveningShell /> : <React.StrictMode><App /></React.StrictMode>;
createRoot(document.getElementById("root")!).render(experience);
