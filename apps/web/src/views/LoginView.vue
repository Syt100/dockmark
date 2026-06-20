<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { authMessage, authSetupStatus, signIn } from '../auth/state'
import AppButton from '../components/AppButton.vue'
import AppInput from '../components/AppInput.vue'
import FeedbackMessage from '../components/FeedbackMessage.vue'

const route = useRoute()
const router = useRouter()

const email = ref('')
const password = ref('')
const error = ref<string | null>(null)
const loading = ref(false)

const configurationMessage = computed(() => authSetupStatus.value?.message ?? null)

async function submit() {
  error.value = null
  loading.value = true

  try {
    await signIn({
      email: email.value,
      password: password.value,
    })

    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    await router.replace(redirect)
  } catch (caught) {
    error.value = authMessage(caught, '登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="mx-auto grid min-h-[70vh] max-w-md content-center">
    <section class="dm-surface grid gap-5 p-[var(--dm-panel-padding)]">
      <div>
        <p class="text-sm font-medium text-[var(--dm-primary)]">Dockmark</p>
        <h1 class="mt-1 text-2xl font-semibold text-[var(--dm-text)]">登录</h1>
      </div>

      <FeedbackMessage tone="error" :message="configurationMessage" />
      <FeedbackMessage tone="error" :message="error" />

      <form class="grid gap-[var(--dm-form-gap)]" @submit.prevent="submit">
        <label class="grid gap-2">
          <span class="dm-label">邮箱</span>
          <AppInput
            v-model="email"
            autocomplete="username"
            name="email"
            placeholder="you@example.com"
            required
            type="email"
          />
        </label>

        <label class="grid gap-2">
          <span class="dm-label">密码</span>
          <AppInput
            v-model="password"
            autocomplete="current-password"
            name="password"
            placeholder="管理员密码"
            required
            type="password"
          />
        </label>

        <AppButton
          :disabled="loading || Boolean(configurationMessage)"
          class="w-full"
          tone="primary"
          type="submit"
        >
          {{ loading ? '正在登录...' : '登录' }}
        </AppButton>
      </form>
    </section>
  </main>
</template>
