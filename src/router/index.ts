import { createRouter, createWebHashHistory } from "vue-router";

const Contrast = () => import("@/views/Contrast.vue");
const Settings = () => import("@/views/Settings.vue");

const routes = [
  {
    path: "/",
    redirect: "/contrast",
  },
  {
    path: "/contrast",
    name: "contrast",
    component: Contrast,
  },
  {
    path: "/settings",
    name: "settings",
    component: Settings,
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
