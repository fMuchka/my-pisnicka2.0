<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';
  import { ArrowUpDown, ArrowDown, ArrowUp, Search } from 'lucide-vue-next';
  import TopNavigation from '../components/top-navigation/TopNavigation.vue';
  import LoadingSpinner from '../components/core/LoadingSpinner.vue';
  import ErrorMessage from '../components/core/ErrorMessage.vue';
  import { fetchAllUserSessions, createSessionRouterQuery, type Session } from '../lib/session';
  import { formatSessionAge } from '../lib/formatter';
  import { useAuth } from '../composables/useAuth';
  import { useSessionStore } from '../stores/session';
  import Routes from '../router/Routes';

  const TITLE = 'Seznam Relací';
  const TAG_LINE = 'Vzpomínky nemizí';

  type SortField = 'name' | 'createdAt' | 'pin';
  type SortDir = 'asc' | 'desc';
  type RoleFilter = 'all' | 'owned' | 'joined';
  type StatusFilter = 'all' | 'open' | 'closed';

  const { user } = useAuth();
  const router = useRouter();
  const sessionStore = useSessionStore();

  const sessions = ref<Session[]>([]);
  const loading = ref(true);
  const error = ref<string | null>(null);

  const search = ref('');
  const roleFilter = ref<RoleFilter>('all');
  const statusFilter = ref<StatusFilter>('all');
  const sortField = ref<SortField>('createdAt');
  const sortDir = ref<SortDir>('desc');

  onMounted(async () => {
    const uid = user.value?.uid;
    if (!uid) {
      loading.value = false;
      return;
    }
    try {
      sessions.value = await fetchAllUserSessions(uid);
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Chyba při načítání relací';
    } finally {
      loading.value = false;
    }
  });

  const filtered = computed(() => {
    const uid = user.value?.uid ?? '';
    const q = search.value.trim().toLowerCase();

    return sessions.value
      .filter((s) => {
        if (q && !s.name.toLowerCase().includes(q)) return false;
        if (roleFilter.value === 'owned' && s.hostId !== uid) return false;
        if (roleFilter.value === 'joined' && s.hostId === uid) return false;
        if (statusFilter.value === 'open' && !s.isActive) return false;
        if (statusFilter.value === 'closed' && s.isActive) return false;
        return true;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortField.value === 'name') {
          cmp = a.name.localeCompare(b.name, 'cs');
        } else if (sortField.value === 'pin') {
          cmp = a.pin.localeCompare(b.pin);
        } else {
          const diff = a.createdAt.seconds - b.createdAt.seconds;
          cmp = diff !== 0 ? diff : a.createdAt.nanoseconds - b.createdAt.nanoseconds;
        }
        return sortDir.value === 'asc' ? cmp : -cmp;
      });
  });

  const toggleSort = (field: SortField) => {
    if (sortField.value === field) {
      sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc';
    } else {
      sortField.value = field;
      sortDir.value = 'asc';
    }
  };

  const openSession = (session: Session) => {
    sessionStore.setSessionFromModel(session);
    router.push({ path: Routes.Session, query: createSessionRouterQuery(session) });
  };

  const roleOptions: { value: RoleFilter; label: string }[] = [
    { value: 'all', label: 'Vše' },
    { value: 'owned', label: 'Vlastní' },
    { value: 'joined', label: 'Připojené' },
  ];

  const statusOptions: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'Vše' },
    { value: 'open', label: 'Otevřená' },
    { value: 'closed', label: 'Uzavřená' },
  ];
</script>

<template>
  <TopNavigation
    :page-title="TITLE"
    :page-subtitle="TAG_LINE"
  />

  <div
    class="container"
    data-testid="session-list-view"
  >
    <!-- Search -->
    <div class="search-wrapper">
      <Search
        class="search-icon"
        :size="16"
      />
      <input
        v-model="search"
        class="search-input"
        type="search"
        placeholder="Hledat podle názvu…"
        aria-label="Hledat relace"
      />
    </div>

    <!-- Filters -->
    <div class="filters">
      <div
        class="filter-group"
        role="group"
        aria-label="Filtrovat podle role"
      >
        <button
          v-for="opt in roleOptions"
          :key="opt.value"
          class="filter-chip"
          :class="{ active: roleFilter === opt.value }"
          :aria-pressed="roleFilter === opt.value"
          @click="roleFilter = opt.value"
        >
          {{ opt.label }}
        </button>
      </div>

      <div
        class="filter-group"
        role="group"
        aria-label="Filtrovat podle stavu"
      >
        <button
          v-for="opt in statusOptions"
          :key="opt.value"
          class="filter-chip"
          :class="{ active: statusFilter === opt.value }"
          :aria-pressed="statusFilter === opt.value"
          @click="statusFilter = opt.value"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>

    <!-- Loading / error -->
    <LoadingSpinner
      v-if="loading"
      label="Načítání relací…"
    />

    <ErrorMessage
      v-else-if="error"
      :message="error"
    />

    <!-- Table -->
    <template v-else>
      <div
        v-if="filtered.length === 0"
        class="empty-state"
      >
        Žádné relace neodpovídají filtru.
      </div>

      <div
        v-else
        class="table-scroll"
      >
        <div
          class="table-wrapper"
          role="table"
          aria-label="Seznam relací"
        >
          <!-- Header row -->
          <div
            class="table-row header-row"
            role="row"
          >
            <div
              class="th sortable col-name"
              role="columnheader"
              :aria-sort="
                sortField === 'name' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'
              "
              @click="toggleSort('name')"
            >
              Název
              <component
                :is="sortField === 'name' ? (sortDir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown"
                :size="13"
                class="sort-icon"
              />
            </div>
            <div
              class="th sortable col-pin"
              role="columnheader"
              :aria-sort="
                sortField === 'pin' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'
              "
              @click="toggleSort('pin')"
            >
              PIN
              <component
                :is="sortField === 'pin' ? (sortDir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown"
                :size="13"
                class="sort-icon"
              />
            </div>
            <div
              class="th col-status"
              role="columnheader"
            >
              Stav
            </div>
            <div
              class="th col-role"
              role="columnheader"
            >
              Role
            </div>
            <div
              class="th sortable col-age"
              role="columnheader"
              :aria-sort="
                sortField === 'createdAt'
                  ? sortDir === 'asc'
                    ? 'ascending'
                    : 'descending'
                  : 'none'
              "
              @click="toggleSort('createdAt')"
            >
              Vytvořeno
              <component
                :is="
                  sortField === 'createdAt'
                    ? sortDir === 'asc'
                      ? ArrowUp
                      : ArrowDown
                    : ArrowUpDown
                "
                :size="13"
                class="sort-icon"
              />
            </div>
          </div>

          <!-- Data rows -->
          <div
            v-for="session in filtered"
            :key="session.id"
            class="table-row data-row"
            role="row"
            tabindex="0"
            @click="openSession(session)"
            @keydown.enter="openSession(session)"
            @keydown.space.prevent="openSession(session)"
          >
            <div
              class="td col-name"
              role="cell"
            >
              {{ session.name }}
            </div>
            <div
              class="td col-pin"
              role="cell"
            >
              <code class="pin-code">{{ session.pin }}</code>
            </div>
            <div
              class="td col-status"
              role="cell"
            >
              <span
                class="status-tag"
                :class="session.isActive ? 'status-tag-open' : 'status-tag-closed'"
              >
                {{ session.isActive ? 'Otevřená' : 'Uzavřená' }}
              </span>
            </div>
            <div
              class="td col-role"
              role="cell"
            >
              <span
                class="role-tag"
                :class="session.hostId === user?.uid ? 'role-tag-owner' : 'role-tag-joined'"
              >
                {{ session.hostId === user?.uid ? 'Vlastní' : 'Připojená' }}
              </span>
            </div>
            <div
              class="td col-age"
              role="cell"
            >
              {{ formatSessionAge(session.createdAt) }}
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
  .container {
    max-width: 720px;
    margin: auto;
    width: 100%;
    font-family: var(--font-body);
    color: var(--text-primary);
    padding: var(--space-md);
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }

  /* Search */
  .search-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .search-icon {
    position: absolute;
    left: 10px;
    color: var(--text-secondary);
    pointer-events: none;
  }

  .search-input {
    width: 100%;
    padding: 8px 12px 8px 34px;
    border: 1px solid var(--bg-tertiary);
    border-radius: var(--radius-sm);
    background-color: var(--bg-secondary);
    color: var(--text-primary);
    font-size: 14px;
    font-family: var(--font-body);
  }

  .search-input:focus {
    outline: none;
    border-color: var(--color-primary);
  }

  /* Filters */
  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-sm);
  }

  .filter-group {
    display: flex;
    gap: 4px;
  }

  .filter-chip {
    padding: 4px 12px;
    border-radius: 999px;
    border: 1px solid var(--bg-tertiary);
    background-color: var(--bg-secondary);
    color: var(--text-secondary);
    font-size: 13px;
    font-family: var(--font-body);
    cursor: pointer;
    transition: all 120ms ease;
  }

  .filter-chip:hover {
    background-color: var(--bg-tertiary);
    color: var(--text-primary);
  }

  .filter-chip.active {
    background-color: var(--color-primary);
    color: #fff;
    border-color: var(--color-primary);
  }

  /* Table */
  .table-scroll {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    border: 1px solid var(--bg-tertiary);
    border-radius: var(--radius-sm);
  }

  .table-wrapper {
    display: flex;
    flex-direction: column;
    width: 100%;
    min-width: 520px;
  }

  .table-row {
    display: grid;
    grid-template-columns: minmax(140px, 1fr) 70px 110px 100px minmax(120px, 1fr);
    align-items: center;
    gap: var(--space-sm);
    padding: 10px var(--space-md);
  }

  .header-row {
    background-color: var(--bg-secondary);
    border-bottom: 1px solid var(--bg-tertiary);
  }

  .data-row {
    background-color: var(--bg-primary);
    border-bottom: 1px solid var(--bg-tertiary);
    cursor: pointer;
    transition: background-color 120ms ease;
  }

  .data-row:last-child {
    border-bottom: none;
  }

  .data-row:hover,
  .data-row:focus-visible {
    background-color: var(--bg-secondary);
    outline: none;
  }

  .th {
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--text-secondary);
  }

  .th.sortable {
    display: flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    user-select: none;
  }

  .th.sortable:hover {
    color: var(--text-primary);
  }

  .sort-icon {
    flex-shrink: 0;
  }

  .td {
    font-size: 14px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .pin-code {
    font-family: var(--font-mono, monospace);
    font-size: 13px;
    letter-spacing: 0.1em;
    background-color: var(--bg-tertiary);
    padding: 1px 5px;
    border-radius: 4px;
  }

  /* Status tag */
  .status-tag,
  .role-tag {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
    line-height: 1.2;
  }

  .status-tag-open {
    color: #175429;
    background-color: #dff7e6;
  }

  .status-tag-closed {
    color: #6e2c2c;
    background-color: #f9e2e2;
  }

  .role-tag-owner {
    color: #1a3a6e;
    background-color: #ddeeff;
  }

  .role-tag-joined {
    color: #4e3a04;
    background-color: #fef3cd;
  }

  /* Empty / error */
  .empty-state {
    text-align: center;
    padding: var(--space-lg);
    color: var(--text-secondary);
    font-size: 14px;
  }
</style>
