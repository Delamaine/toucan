import Vue = require('vue');
import Vuex = require('vuex');
import VueRouter = require('vue-router');
import VueI18n = require('vue-i18n');
import Vuelidate = require('vuelidate');
import { RouteGuards, RouteNames, RouterOptions } from './routes';
import { TokenHelper, UseAxios } from '../common';
import { Loader, StatusBar } from '../components';
import { Locales } from '../locales';
import * as Plugins from '../plugins';
import { GlobalConfig } from '../config';
import { AreaNavigation } from './navigation/navigation';
import { AdminStoreTypes } from './store';
import { AreaFooter } from './footer/footer';

Vue.use(Vuex);

import './admin.scss';
import { Store } from './store/store';

Vue.use(<any>VueI18n); // languages

Object.keys(Locales).forEach((lang) => {
  (<any>Vue).locale(lang, Locales[lang]);
})

Vue.use(Vuelidate.default); // validation
Vue.use(VueRouter); // router
const router = new VueRouter(RouterOptions);
let routeOptions = {
  resolveUser: () => Store.state.common.user,
  forbiddenRouteName: RouteNames.forbidden,
  loginRouteName: RouteNames.login,
  verifyRouteName: RouteNames.verify
};
router.beforeEach(RouteGuards(routeOptions));

Vue.use(Plugins.CommonsPlugin, {
  store: <never>Store,
}); 

Vue.use(Plugins.UserOptionsPlugin, {
  key: GlobalConfig.uopt,
  default: { locale: 'en' },
  store: <never>Store,
  watchLocaleChanges: true
});   // user settings

UseAxios(router);

Vue.component('status-bar', StatusBar);

export const app = new Vue({

  router,

  components: {
    AreaFooter,
    Loader,
    Navigation: AreaNavigation
  },

  store: Store,

  created() {

    // check if location hash has state/nonce value ...
    let resumeExternalLogin = () => {

      if (location.hash && location.hash.indexOf("state") != -1) {

        let hash = location.hash.substring(1);

        if (hash.indexOf("access_token") != -1 || hash.indexOf("error") != -1) {
          router.push({
            name: RouteNames.login,
            query: { hash: hash }
          });
        }
      }
    }

    let token = TokenHelper.getAccessToken();

    Store.dispatch(AdminStoreTypes.common.updateUser, token)
      .then(() => Store.dispatch(AdminStoreTypes.common.loadingState, false))
      .then(() => resumeExternalLogin());
  },

  computed: {

    isLoading: () => Store.state.common.isLoading
  }

}).$mount('#app');
