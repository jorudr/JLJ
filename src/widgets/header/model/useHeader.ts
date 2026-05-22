import { ref } from "vue";
import { isNotificationOpen } from '~/widgets/notifications/model/useNotifications';

export const methods = ref(false);

export const scrollY = ref(0);
export const isHeaderExpanded = ref(true);


export const showMethods = () => {
  methods.value = !methods.value
  isNotificationOpen.value = false
}

export const reloadPage = () => {
  window.location.reload()
}


export function handleScroll() {
  scrollY.value = window.scrollY
}

