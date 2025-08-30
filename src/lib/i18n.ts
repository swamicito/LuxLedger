import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// Language resources
const resources = {
  en: {
    translation: {
      // Navigation
      nav: {
        marketplace: 'Marketplace',
        dashboard: 'Dashboard',
        portfolio: 'Portfolio',
        trading: 'Trading',
        admin: 'Admin',
        auth: 'Sign In'
      },
      // Common
      common: {
        loading: 'Loading...',
        error: 'Error',
        success: 'Success',
        cancel: 'Cancel',
        confirm: 'Confirm',
        save: 'Save',
        delete: 'Delete',
        edit: 'Edit',
        view: 'View',
        buy: 'Buy Now',
        sell: 'Sell',
        price: 'Price',
        currency: 'Currency',
        language: 'Language'
      },
      // Marketplace
      marketplace: {
        title: 'Luxury Asset Marketplace',
        subtitle: 'Discover exclusive tokenized luxury assets',
        filters: {
          all: 'All Assets',
          realEstate: 'Real Estate',
          jewelry: 'Jewelry',
          exoticCars: 'Exotic Cars',
          watches: 'Watches',
          art: 'Fine Art',
          priceRange: 'Price Range',
          region: 'Region'
        },
        regions: {
          global: 'Global',
          northAmerica: 'North America',
          europe: 'Europe',
          asia: 'Asia',
          middleEast: 'Middle East',
          latinAmerica: 'Latin America'
        }
      },
      // Dashboard
      dashboard: {
        title: 'Dashboard',
        welcome: 'Welcome back',
        kyc: {
          status: 'KYC Status',
          verified: 'Verified',
          pending: 'Pending',
          required: 'Verification Required',
          startVerification: 'Start Verification'
        },
        portfolio: {
          totalValue: 'Total Portfolio Value',
          assets: 'Assets Owned',
          recentActivity: 'Recent Activity'
        }
      },
      // Portfolio
      portfolio: {
        title: 'My Portfolio',
        holdings: 'Holdings',
        lending: 'Token Lending',
        resale: 'Resale Options',
        performance: 'Performance',
        lendingApr: 'Lending APR',
        availableToLend: 'Available to Lend'
      },
      // Trading
      trading: {
        title: 'Trading',
        dexOffers: 'DEX Offers',
        createOffer: 'Create Offer',
        orderBook: 'Order Book',
        tradeHistory: 'Trade History',
        buyOffers: 'Buy Offers',
        sellOffers: 'Sell Offers'
      },
      // Auth
      auth: {
        signIn: 'Sign In',
        signUp: 'Sign Up',
        signOut: 'Sign Out',
        connectWallet: 'Connect Wallet',
        socialLogin: 'Continue with',
        email: 'Email',
        password: 'Password',
        confirmPassword: 'Confirm Password',
        forgotPassword: 'Forgot Password?'
      },
      // Legal & Compliance
      legal: {
        disclaimer: 'Investment Disclaimer',
        terms: 'Terms of Service',
        privacy: 'Privacy Policy',
        compliance: 'Regulatory Compliance',
        riskWarning: 'Risk Warning: Digital assets are volatile and may lose value.'
      }
    }
  },
  es: {
    translation: {
      nav: {
        marketplace: 'Mercado',
        dashboard: 'Panel',
        portfolio: 'Cartera',
        trading: 'Comercio',
        admin: 'Admin',
        auth: 'Iniciar Sesión'
      },
      common: {
        loading: 'Cargando...',
        error: 'Error',
        success: 'Éxito',
        cancel: 'Cancelar',
        confirm: 'Confirmar',
        save: 'Guardar',
        delete: 'Eliminar',
        edit: 'Editar',
        view: 'Ver',
        buy: 'Comprar Ahora',
        sell: 'Vender',
        price: 'Precio',
        currency: 'Moneda',
        language: 'Idioma'
      },
      marketplace: {
        title: 'Mercado de Activos de Lujo',
        subtitle: 'Descubre activos de lujo tokenizados exclusivos',
        filters: {
          all: 'Todos los Activos',
          realEstate: 'Bienes Raíces',
          jewelry: 'Joyería',
          exoticCars: 'Autos Exóticos',
          watches: 'Relojes',
          art: 'Arte Fino',
          priceRange: 'Rango de Precio',
          region: 'Región'
        },
        regions: {
          global: 'Global',
          northAmerica: 'América del Norte',
          europe: 'Europa',
          asia: 'Asia',
          middleEast: 'Medio Oriente',
          latinAmerica: 'América Latina'
        }
      },
      dashboard: {
        title: 'Panel de Control',
        welcome: 'Bienvenido de nuevo',
        kyc: {
          status: 'Estado KYC',
          verified: 'Verificado',
          pending: 'Pendiente',
          required: 'Verificación Requerida',
          startVerification: 'Iniciar Verificación'
        }
      },
      legal: {
        riskWarning: 'Advertencia de Riesgo: Los activos digitales son volátiles y pueden perder valor.'
      }
    }
  },
  ar: {
    translation: {
      nav: {
        marketplace: 'السوق',
        dashboard: 'لوحة التحكم',
        portfolio: 'المحفظة',
        trading: 'التداول',
        admin: 'الإدارة',
        auth: 'تسجيل الدخول'
      },
      common: {
        loading: 'جاري التحميل...',
        error: 'خطأ',
        success: 'نجح',
        cancel: 'إلغاء',
        confirm: 'تأكيد',
        save: 'حفظ',
        delete: 'حذف',
        edit: 'تعديل',
        view: 'عرض',
        buy: 'اشتري الآن',
        sell: 'بيع',
        price: 'السعر',
        currency: 'العملة',
        language: 'اللغة'
      },
      marketplace: {
        title: 'سوق الأصول الفاخرة',
        subtitle: 'اكتشف الأصول الفاخرة المرمزة الحصرية',
        filters: {
          all: 'جميع الأصول',
          realEstate: 'العقارات',
          jewelry: 'المجوهرات',
          exoticCars: 'السيارات الفاخرة',
          watches: 'الساعات',
          art: 'الفن الراقي',
          priceRange: 'نطاق السعر',
          region: 'المنطقة'
        }
      },
      legal: {
        riskWarning: 'تحذير من المخاطر: الأصول الرقمية متقلبة وقد تفقد قيمتها.'
      }
    }
  },
  zh: {
    translation: {
      nav: {
        marketplace: '市场',
        dashboard: '仪表板',
        portfolio: '投资组合',
        trading: '交易',
        admin: '管理',
        auth: '登录'
      },
      common: {
        loading: '加载中...',
        error: '错误',
        success: '成功',
        cancel: '取消',
        confirm: '确认',
        save: '保存',
        delete: '删除',
        edit: '编辑',
        view: '查看',
        buy: '立即购买',
        sell: '出售',
        price: '价格',
        currency: '货币',
        language: '语言'
      },
      marketplace: {
        title: '奢侈品资产市场',
        subtitle: '发现独家代币化奢侈品资产',
        filters: {
          all: '所有资产',
          realEstate: '房地产',
          jewelry: '珠宝',
          exoticCars: '豪华汽车',
          watches: '手表',
          art: '艺术品',
          priceRange: '价格范围',
          region: '地区'
        }
      },
      legal: {
        riskWarning: '风险警告：数字资产具有波动性，可能会失去价值。'
      }
    }
  },
  ru: {
    translation: {
      nav: {
        marketplace: 'Маркетплейс',
        dashboard: 'Панель',
        portfolio: 'Портфель',
        trading: 'Торговля',
        admin: 'Админ',
        auth: 'Войти'
      },
      common: {
        loading: 'Загрузка...',
        error: 'Ошибка',
        success: 'Успех',
        cancel: 'Отмена',
        confirm: 'Подтвердить',
        save: 'Сохранить',
        delete: 'Удалить',
        edit: 'Редактировать',
        view: 'Просмотр',
        buy: 'Купить сейчас',
        sell: 'Продать',
        price: 'Цена',
        currency: 'Валюта',
        language: 'Язык'
      },
      marketplace: {
        title: 'Маркетплейс Роскошных Активов',
        subtitle: 'Откройте для себя эксклюзивные токенизированные роскошные активы',
        filters: {
          all: 'Все активы',
          realEstate: 'Недвижимость',
          jewelry: 'Ювелирные изделия',
          exoticCars: 'Эксклюзивные автомобили',
          watches: 'Часы',
          art: 'Изобразительное искусство',
          priceRange: 'Ценовой диапазон',
          region: 'Регион'
        }
      },
      legal: {
        riskWarning: 'Предупреждение о рисках: Цифровые активы волатильны и могут потерять в стоимости.'
      }
    }
  }
};

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: import.meta.env.DEV,
    
    interpolation: {
      escapeValue: false,
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
    
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
  });

export default i18n;
