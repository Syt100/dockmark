<script setup lang="ts">
import { computed } from 'vue'

import { buildInfo, formatBuildTime } from '../buildInfo'

const displayedVersion = computed(() => `v${buildInfo.version}`)
const displayedBuildTime = computed(() => formatBuildTime(buildInfo.buildTime))
</script>

<template>
  <main class="dm-surface p-6">
    <h1 class="text-2xl font-semibold text-[var(--dm-text)]">关于 Dockmark</h1>
    <p class="mt-3 max-w-2xl leading-6 text-[var(--dm-text-muted)]">
      Dockmark 是运行在 Cloudflare Serverless 平台上的个人 Homelab 服务导航与浏览器书签同步系统。
      当前阶段优先完善服务导航，不保存密码、token 或其他登录秘密。
    </p>
    <dl
      class="mt-6 grid max-w-xl gap-4 border-t border-[var(--dm-border)] pt-5 text-sm sm:grid-cols-[8rem_1fr]"
    >
      <dt class="font-medium text-[var(--dm-text)]">版本号</dt>
      <dd class="font-mono text-[var(--dm-text-muted)]">{{ displayedVersion }}</dd>

      <dt class="font-medium text-[var(--dm-text)]">Git 提交</dt>
      <dd class="font-mono text-[var(--dm-text-muted)]">{{ buildInfo.commitShort }}</dd>

      <dt class="font-medium text-[var(--dm-text)]">构建时间</dt>
      <dd class="font-mono text-[var(--dm-text-muted)]">{{ displayedBuildTime }}</dd>
    </dl>
  </main>
</template>
