import { createRouter, createWebHistory } from 'vue-router'
import { authSetupStatus, currentUser, ensureAuthState } from '../auth/state'

const loadServicesView = () => import('../views/ServicesView.vue')
const loadServiceEditorView = () => import('../views/ServiceEditorView.vue')
const loadCategoriesView = () => import('../views/CategoriesView.vue')
const loadCategoryEditorView = () => import('../views/CategoryEditorView.vue')
const loadTagsView = () => import('../views/TagsView.vue')
const loadTagEditorView = () => import('../views/TagEditorView.vue')
const loadImportExportView = () => import('../views/ImportExportView.vue')
const loadAboutView = () => import('../views/AboutView.vue')
const loadLoginView = () => import('../views/LoginView.vue')
const loadSetupView = () => import('../views/SetupView.vue')

export function preloadPrimaryRoutes() {
  void Promise.allSettled([
    loadServicesView(),
    loadCategoriesView(),
    loadTagsView(),
    loadImportExportView(),
    loadAboutView(),
  ])
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      redirect: '/services',
    },
    {
      path: '/services',
      name: 'services',
      component: loadServicesView,
      children: [
        {
          path: 'new',
          name: 'service-new',
          component: loadServiceEditorView,
        },
        {
          path: ':id/edit',
          name: 'service-edit',
          component: loadServiceEditorView,
        },
      ],
    },
    {
      path: '/categories',
      name: 'categories',
      component: loadCategoriesView,
      children: [
        {
          path: 'new',
          name: 'category-new',
          component: loadCategoryEditorView,
        },
        {
          path: ':id/edit',
          name: 'category-edit',
          component: loadCategoryEditorView,
        },
      ],
    },
    {
      path: '/tags',
      name: 'tags',
      component: loadTagsView,
      children: [
        {
          path: 'new',
          name: 'tag-new',
          component: loadTagEditorView,
        },
        {
          path: ':id/edit',
          name: 'tag-edit',
          component: loadTagEditorView,
        },
      ],
    },
    {
      path: '/about',
      name: 'about',
      component: loadAboutView,
    },
    {
      path: '/import-export',
      name: 'import-export',
      component: loadImportExportView,
    },
    {
      path: '/login',
      name: 'login',
      component: loadLoginView,
      meta: { public: true },
    },
    {
      path: '/setup',
      name: 'setup',
      component: loadSetupView,
      meta: { public: true },
    },
  ],
})

router.beforeEach(async (to, from) => {
  await ensureAuthState()

  const isPublic = to.meta.public === true
  const cameFromServiceEditor = from.name === 'service-new' || from.name === 'service-edit'

  if (authSetupStatus.value?.needsSetup && to.name !== 'setup') {
    return { name: 'setup' }
  }

  if (!authSetupStatus.value?.needsSetup && to.name === 'setup') {
    return { name: currentUser.value ? 'services' : 'login' }
  }

  if (!currentUser.value && !isPublic) {
    return {
      name: 'login',
      query: { redirect: to.fullPath },
    }
  }

  if (currentUser.value && to.name === 'login') {
    return { name: 'services' }
  }

  if (
    to.name === 'services' &&
    cameFromServiceEditor &&
    from.query.view === 'list' &&
    to.query.view !== 'list'
  ) {
    return {
      name: 'services',
      query: { ...to.query, view: 'list' },
    }
  }

  return true
})

export default router
