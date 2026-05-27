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
      },
      descriptions: {
        knowledge_matrix: "Collaborative protocol exchange and strategic link network.",
        activity_monitor: "Core tactical data repository and historical consistency matrix.",
        genesis_protocol: "Module management and neural diary reification sequence."
      },
      ui: {
        signedInAs: "Signed_In_As",
        signOut: "Sign_Out",
        accessProtocol: "ACCESS_PROTOCOL",
        systemTime: "System_Time: 04:22:19",
        encryption: "Encryption: AES-256_REIFIED"
      }
    },
    tacticalNodeMap: {
      betterThan: "This trade is better than",
      ofYourTrades: "of your trades",
      viewAnalytics: "View Trade Analytics Reified",
      terminateLink: "Terminate Neural Link",
      entryHub: "ENTRY_HUB",
      exitHub: "EXIT_HUB",
      frequency: "Frequency",
      pfRatio: "PF_Ratio",
      freqShort: "FREQ",
      pfShort: "P/F",
      diagnosticTelemetry: "Diagnostic_Telemetry",
      resetView: "Reset_View",
      frequencyDashed: "Frequency_Dashed",
      pfNormal: "PF_Normal",
      liveAnalysis: "Live_Analysis",
      liveHistory: "Live_History",
      entryProtocol: "Entry_Protocol",
      exitProtocol: "Exit_Protocol"
    },
    activityMonitor: {
      title: "Activity Monitor",
      subtitle: "Core tactical data repository and historical consistency matrix.",
      archiveDate: "Archive_Date:",
      initializing: "Initializing...",
      sessionActive: "Session_Active",
      initializeSession: "Initialize_Session"
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
      },
      descriptions: {
        knowledge_matrix: "Совместный обмен протоколами и сеть стратегических связей.",
        activity_monitor: "Основной репозиторий тактических данных и матрица истории.",
        genesis_protocol: "Управление модулями и последовательность восстановления дневника."
      },
      ui: {
        signedInAs: "Вошел_Как",
        signOut: "Выйти",
        accessProtocol: "ПРОТОКОЛ_ДОСТУПА",
        systemTime: "Системное_Время: 04:22:19",
        encryption: "Шифрование: AES-256_REIFIED"
      }
    },
    tacticalNodeMap: {
      betterThan: "Эта сделка лучше, чем",
      ofYourTrades: "ваших сделок",
      viewAnalytics: "Просмотр Аналитики Сделки",
      terminateLink: "Прервать Нейронную Связь",
      entryHub: "УЗЕЛ_ВХОДА",
      exitHub: "УЗЕЛ_ВЫХОДА",
      frequency: "Частота",
      pfRatio: "Коэф_ПФ",
      freqShort: "ЧАСТ",
      pfShort: "П/Ф",
      diagnosticTelemetry: "Диагностическая_Телеметрия",
      resetView: "Сброс_Вида",
      frequencyDashed: "Частота_Пунктир",
      pfNormal: "ПФ_Обычный",
      liveAnalysis: "Анализ_Реал_Врем",
      liveHistory: "Живая_История",
      entryProtocol: "Протокол_Входа",
      exitProtocol: "Протокол_Выхода"
    },
    activityMonitor: {
      title: "Мониторинг Активности",
      subtitle: "Основной репозиторий тактических данных и матрица истории.",
      archiveDate: "Дата_Архива:",
      initializing: "Инициализация...",
      sessionActive: "Сессия_Активна",
      initializeSession: "Инициализировать_Сессию"
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
