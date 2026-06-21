import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { authSetupStatus, currentUser, ensureAuthState } from '../auth/state'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/services',
      name: 'services',
      component: () => import('../views/ServicesView.vue'),
      children: [
        {
          path: 'new',
          name: 'service-new',
          component: () => import('../views/ServiceEditorView.vue'),
        },
        {
          path: ':id/edit',
          name: 'service-edit',
          component: () => import('../views/ServiceEditorView.vue'),
        },
      ],
    },
    {
      path: '/categories',
      name: 'categories',
      component: () => import('../views/CategoriesView.vue'),
      children: [
        {
          path: 'new',
          name: 'category-new',
          component: () => import('../views/CategoryEditorView.vue'),
        },
        {
          path: ':id/edit',
          name: 'category-edit',
          component: () => import('../views/CategoryEditorView.vue'),
        },
      ],
    },
    {
      path: '/tags',
      name: 'tags',
      component: () => import('../views/TagsView.vue'),
      children: [
        {
          path: 'new',
          name: 'tag-new',
          component: () => import('../views/TagEditorView.vue'),
        },
        {
          path: ':id/edit',
          name: 'tag-edit',
          component: () => import('../views/TagEditorView.vue'),
        },
      ],
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue'),
    },
    {
      path: '/import-export',
      name: 'import-export',
      component: () => import('../views/ImportExportView.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { public: true },
    },
    {
      path: '/setup',
      name: 'setup',
      component: () => import('../views/SetupView.vue'),
      meta: { public: true },
    },
  ],
})

router.beforeEach(async (to) => {
  await ensureAuthState()

  const isPublic = to.meta.public === true

  if (authSetupStatus.value?.needsSetup && to.name !== 'setup') {
    return { name: 'setup' }
  }

  if (!authSetupStatus.value?.needsSetup && to.name === 'setup') {
    return { name: currentUser.value ? 'home' : 'login' }
  }

  if (!currentUser.value && !isPublic) {
    return {
      name: 'login',
      query: { redirect: to.fullPath },
    }
  }

  if (currentUser.value && to.name === 'login') {
    return { name: 'home' }
  }

  return true
})

export default router
