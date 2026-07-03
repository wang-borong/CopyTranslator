import { ref, onMounted, onUnmounted } from "vue";

export function useWindowResize() {
  const windowHeight = ref(window.innerHeight);
  const windowWidth = ref(window.innerWidth);

  const onResize = () => {
    windowHeight.value = window.innerHeight;
    windowWidth.value = window.innerWidth;
  };

  onMounted(() => {
    window.addEventListener("resize", onResize);
    onResize();
  });

  onUnmounted(() => {
    window.removeEventListener("resize", onResize);
  });

  return {
    windowHeight,
    windowWidth,
  };
}
