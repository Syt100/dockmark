import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

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
  ],
})

export default router
