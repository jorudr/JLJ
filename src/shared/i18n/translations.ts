export const translations = {
  en: {
    dashboard: {
      title: "Tactical Dashboard",
      subtitle: "System_Registry // Layer_0x01",
      welcome: "Welcome back, Operator.",
      modules: {
        knowledge_matrix: "Knowledge\nMatrix",
        activity_monitor: "Activity\nMonitor",
        genesis_protocol: "Genesis\nProtocol"
      }
    },
    common: {
      back: "Return_to_Nexus",
      loading: "Reifying Data...",
      status: "Status",
      online: "Reified",
      offline: "Void"
    }
  },
  ru: {
    dashboard: {
      title: "Тактическая Панель",
      subtitle: "Системный_Реестр // Слой_0x01",
      welcome: "С возвращением, Оператор.",
      modules: {
        knowledge_matrix: "Матрица\nЗнаний",
        activity_monitor: "Мониторинг\nАктивности",
        genesis_protocol: "Протокол\nГенезис"
      }
    },
    common: {
      back: "Вернуться_к_Центру",
      loading: "Восстановление Данных...",
      status: "Статус",
      online: "Активен",
      offline: "Пустота"
    }
  }
}

export type Locale = keyof typeof translations
