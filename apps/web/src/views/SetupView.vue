<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import { authMessage, setupAndSignIn } from '../auth/state'
import AppButton from '../components/AppButton.vue'
import AppInput from '../components/AppInput.vue'
import FeedbackMessage from '../components/FeedbackMessage.vue'

const router = useRouter()

const setupToken = ref('')
const email = ref('')
const name = ref('')
const password = ref('')
const error = ref<string | null>(null)
const loading = ref(false)

async function submit() {
  error.value = null
  loading.value = true

  try {
    await setupAndSignIn({
      setupToken: setupToken.value,
      email: email.value,
      password: password.value,
      name: name.value,
    })
    await router.replace('/')
  } catch (caught) {
    error.value = authMessage(caught, '初始化失败')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="mx-auto grid min-h-[70vh] max-w-lg content-center">
    <section class="dm-surface grid gap-5 p-[var(--dm-panel-padding)]">
      <div>
        <p class="text-sm font-medium text-[var(--dm-primary)]">Dockmark</p>
        <h1 class="mt-1 text-2xl font-semibold text-[var(--dm-text)]">初始化管理员</h1>
        <p class="mt-2 text-sm leading-6 text-[var(--dm-text-muted)]">
          使用部署时配置的一次性令牌创建管理员账号。
        </p>
      </div>

      <FeedbackMessage tone="error" :message="error" />

      <form class="grid gap-[var(--dm-form-gap)]" @submit.prevent="submit">
        <label class="grid gap-2">
          <span class="dm-label">初始化令牌</span>
          <AppInput
            v-model="setupToken"
            autocomplete="off"
            name="setup-token"
            placeholder="SETUP_TOKEN"
            required
            type="password"
          />
        </label>

        <div class="grid gap-[var(--dm-form-gap)] sm:grid-cols-2">
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
            <span class="dm-label">显示名称</span>
            <AppInput v-model="name" autocomplete="name" name="name" placeholder="管理员" />
          </label>
        </div>

        <label class="grid gap-2">
          <span class="dm-label">密码</span>
          <AppInput
            v-model="password"
            autocomplete="new-password"
            minlength="12"
            name="password"
            placeholder="至少 12 个字符"
            required
            type="password"
          />
        </label>

        <AppButton :disabled="loading" class="w-full" tone="primary" type="submit">
          {{ loading ? '正在初始化...' : '创建管理员' }}
        </AppButton>
      </form>
    </section>
  </main>
</template>
