<template>
  <div class="min-h-screen bg-gradient-to-b from-gray-200 to-gray-300 flex flex-col">
    <div class="flex-1 relative overflow-hidden">
      <transition name="fade" mode="out-in">
        <!-- Formulario de redactar mensaje -->
        <div v-if="showComposeForm" key="compose" class="absolute inset-0 flex flex-col items-center justify-center sm:p-5 p-4 px-4 pt-4 pb-18">
          <div class="w-full max-w-4xl bg-white rounded-xl shadow-lg overflow-hidden flex flex-col" style="min-height:0;">
            <div class="bg-gray-400 text-white text-center py-3 sm:py-4 px-3 sm:px-5 text-lg sm:text-3xl font-light">
              Redactar mensaje
            </div>
            <div class="flex-1 bg-white flex flex-col overflow-hidden">
              <div class="flex-1 relative overflow-y-auto hide-scrollbar p-4 sm:p-7">
                <div class="space-y-4">
                  <div>
                    <label class="block text-gray-700 text-sm font-medium mb-1">Nombre del mensaje</label>
                    <input v-model="newMessage.name" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300" placeholder="Ej: Recordatorio" />
                  </div>
                  <div>
                    <label class="block text-gray-700 text-sm font-medium mb-1">Autor</label>
                    <input v-model="newMessage.author" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300" placeholder="Ej: Juan Pérez" />
                  </div>
                  <div>
                    <label class="block text-gray-700 text-sm font-medium mb-1">Color de fondo</label>
                    <div class="flex flex-wrap gap-2">
                      <div v-for="color in availableColors" :key="color.value" @click="newMessage.color = color.value" class="w-8 h-8 rounded-full cursor-pointer border-2 transition-all" :class="newMessage.color === color.value ? 'border-blue-500 scale-110' : 'border-gray-300'" :style="{ backgroundColor: color.value }"></div>
                    </div>
                  </div>
                  <div>
                    <label class="block text-gray-700 text-sm font-medium mb-1">Contenido del mensaje</label>
                    <textarea v-model="newMessage.content" rows="4" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300" placeholder="Escribe tu mensaje aquí..."></textarea>
                  </div>
                  <div class="flex justify-end space-x-3 pt-4">
                    <button @click="cancelCompose" class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors">
                      Cancelar
                    </button>
                    <button @click="saveMessage" class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors" :disabled="!isFormValid" :class="{ 'opacity-50 cursor-not-allowed': !isFormValid }">
                      Enviar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Mensajes -->
        <div v-else-if="!selectedMessage" key="grid" class="absolute inset-0 flex flex-col items-center justify-center">
          <transition :name="transitionName" mode="out-in">
            <transition-group name="fade-new" tag="div" :key="currentPage" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-7 px-4 py-6 sm:p-10 w-full max-w-7xl mx-auto sm:px-24">
              <div v-for="message in currentPageMessages" :key="message.id" class="relative cursor-pointer transform hover:scale-105 transition-transform shadow-xl hover:shadow-2xl" @click="openMessage(message)">
                <div class="envelope w-full h-[72px] sm:h-36 rounded-xl flex items-center justify-center" :style="{ backgroundColor: message.color || '#FFFFC9' }">
                  <div class="envelope-inner w-full h-full relative">
                    <div class="absolute w-full h-full flex items-center justify-center opacity-20">
                      <div class="w-full h-1/2 border-b border-gray-500"></div>
                      <div class="absolute w-full h-full">
                        <div class="w-full h-1/2 overflow-hidden">
                          <div class="w-full h-full border-b border-gray-500 transform origin-bottom-left rotate-45"></div>
                        </div>
                      </div>
                      <div class="absolute w-full h-full">
                        <div class="w-full h-1/2 overflow-hidden">
                          <div class="w-full h-full border-b border-gray-500 transform origin-bottom-right -rotate-45"></div>
                        </div>
                      </div>
                    </div>
                    <div class="absolute inset-0 flex items-center justify-center">
                      <span class="text-gray-700 text-base sm:text-2xl font-light">{{ message.name }}</span>
                    </div>
                    <div v-if="!message.read" class="absolute -top-2 left-1/2 transform -translate-x-1/2 z-10">
                      <div class="w-5 h-5 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-red-500 to-red-600 border-2 border-white shadow-md animate-pulse"></div>
                    </div>
                    <div v-else class="absolute -top-2 left-1/2 transform -translate-x-1/2 z-10">
                      <div class="w-5 h-5 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 border-2 border-white shadow-md"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div v-for="i in emptySlots" :key="`empty-${i}`" class="w-full h-[72px] sm:h-36"></div>
            </transition-group>
          </transition>

          <!-- Botones de navegación -->
          <button v-if="hasPreviousPage" @click="previousPage" class="absolute left-2 sm:left-10 top-1/2 transform hover:scale-105 transition-transform -translate-y-1/2 z-10 cursor-pointer">
            <img src="@/assets/left.png" alt="Anterior" class="h-10 w-10 sm:h-14 sm:w-14" />
          </button>
          <button v-if="hasNextPage" @click="nextPage" class="absolute right-2 sm:right-10 top-1/2 transform hover:scale-105 transition-transform -translate-y-1/2 z-10 cursor-pointer">
            <img src="@/assets/right.png" alt="Siguiente" class="h-10 w-10 sm:h-14 sm:w-14" />
          </button>
        </div>

        <!-- Detalle del mensaje -->
        <div v-else key="detail" class="absolute inset-0 flex flex-col items-center justify-center p-4 px-4 pt-4 pb-4" @mousedown.self="closeDetailOnOutsideClick">
          <div class="w-full max-w-4xl bg-white rounded-xl shadow-lg overflow-hidden flex flex-col" style="min-height:0;">
            <div class="bg-gray-400 text-white text-center py-3 sm:py-4 px-3 sm:px-5 text-lg sm:text-3xl font-light">
              {{ selectedMessage.name }}
            </div>
            <div class="flex-1 bg-white flex flex-col overflow-hidden">
              <div ref="contentContainer" class="flex-1 relative overflow-y-auto hide-scrollbar">
                <div class="p-4 sm:p-7">
                  <div class="pl-4 sm:pl-[38px] pr-4 text-gray-700 text-base sm:text-2xl font-light">
                    <div class="wii-paper">
                      {{ selectedMessage.content }}
                    </div>
                  </div>
                  <div class="mt-8 mb-4">
                    <div class="text-right text-gray-500 pr-3 sm:pr-5 pb-1 text-sm sm:text-lg">
                      {{ fechaEspanol }}
                    </div>
                    <div class="text-right text-gray-400 pr-3 sm:pr-5 text-base sm:text-2xl font-light">
                      {{ selectedMessage.author || 'Anónimo' }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </div>

    <!-- Footer -->
    <div class="h-12 sm:h-14 bg-gray-200 border-t border-gray-300 flex items-center justify-between px-4 sm:px-5 sticky bottom-0 z-20">
      <div class="flex items-center">
        <button @click="composeMessage" class="mobile-button w-8 h-8 sm:w-11 sm:h-11 bg-blue-100 rounded-full border-4 border-blue-300 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform">
          <div class="w-4 h-4 sm:w-6 sm:h-6 bg-transparent flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 sm:h-5 sm:w-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="4" width="20" height="16" rx="2"></rect>
              <path d="M22 7l-10 5-10-5"></path>
            </svg>
          </div>
        </button>
      </div>
      <div class="text-gray-500 text-sm sm:text-lg font-bold text-center">
        {{ fechaEspanol }}
      </div>
      <div class="flex items-center">
        <button @click="goHome" class="mobile-button w-8 h-8 sm:w-11 sm:h-11 bg-blue-100 rounded-full border-4 border-blue-300 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform">
          <div class="w-4 h-4 sm:w-6 sm:h-6 bg-transparent flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 sm:h-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';

const READ_KEY = 'takimbox_read_messages';

function getReadIds() {
  try {
    return JSON.parse(localStorage.getItem(READ_KEY)) || [];
  } catch {
    return [];
  }
}

function setReadIds(ids) {
  localStorage.setItem(READ_KEY, JSON.stringify(ids));
}

function markRead(id) {
  const ids = getReadIds();
  if (!ids.includes(id)) {
    ids.push(id);
    setReadIds(ids);
  }
}

const messages = ref([]);

const fetchMessages = async () => {
  try {
    const res = await fetch('/api/messages');
    if (res.status === 403) {
      messages.value = [];
      return;
    }
    if (!res.ok) throw new Error('Error al obtener mensajes');
    const data = await res.json();
    const readIds = getReadIds();
    messages.value = data.map(msg => ({
      ...msg,
      read: readIds.includes(msg.id)
    }));
  } catch (e) {
    messages.value = [];
  }
};

const fetchNewMessages = async () => {
  try {
    const res = await fetch('/api/messages');
    if (res.status === 403) return;
    if (!res.ok) return;
    const data = await res.json();
    const readIds = getReadIds();
    const existingIds = new Set(messages.value.map(m => m.id));
    const nuevos = data.filter(msg => !existingIds.has(msg.id));
    if (nuevos.length > 0) {
      nuevos.forEach(msg => {
        msg.read = readIds.includes(msg.id);
      });
      messages.value = [...nuevos, ...messages.value];
    }
  } catch (e) {
    console.error('Error al obtener nuevos mensajes', e);
  }
};

const availableColors = [
  { name: 'Morado pastel', value: '#E1D7F6' },
  { name: 'Lila', value: '#E9D6F7' },
  { name: 'Rosa pastel', value: '#FFD6EC' },
  { name: 'Celeste pastel', value: '#D6F0FF' },
  { name: 'Azul claro', value: '#E6F7FF' },
  { name: 'Verde menta', value: '#D6FFF6' },
  { name: 'Verde claro', value: '#E8F5E9' },
  { name: 'Amarillo pastel', value: '#FFF9C4' },
  { name: 'Amarillo', value: '#FFFFC9' },
  { name: 'Naranja pastel', value: '#FFE5B4' },
  { name: 'Naranja claro', value: '#FFECB3' },
  { name: 'Blanco', value: '#FFFFFF' }
];

const showComposeForm = ref(false);
const newMessage = ref({
  name: '',
  content: '',
  color: '#E1D7F6',
  author: '',
  read: false
});

const isFormValid = computed(() => {
  return newMessage.value.name.trim() !== '' &&
    newMessage.value.content.trim() !== '';
});

const composeMessage = () => {
  showComposeForm.value = true;
  selectedMessage.value = null;
};

const cancelCompose = () => {
  showComposeForm.value = false;
  resetNewMessage();
};

const saveMessage = async () => {
  if (!isFormValid.value) return;
  try {
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newMessage.value.name,
        content: newMessage.value.content,
        color: newMessage.value.color,
        author: newMessage.value.author || 'Anónimo'
      })
    });
    if (!res.ok) throw new Error('Error al enviar mensaje');
    await fetchMessages();
    showComposeForm.value = false;
    resetNewMessage();
    currentPage.value = 0;
  } catch (e) {
    alert('No se pudo enviar el mensaje');
  }
};

const resetNewMessage = () => {
  newMessage.value = {
    name: '',
    content: '',
    color: '#FFFFC9',
    author: '',
    read: false
  };
};

const selectedMessage = ref(null);
const lastPage = ref(0);

const currentPage = ref(0);
const messagesPerPage = ref(9);

const updateMessagesPerPage = () => {
  messagesPerPage.value = window.innerWidth < 640 ? 6 : 9;
};

const revealTimestamp = ref(null);
const revealLoaded = ref(false);

const fetchRevealTimestamp = async () => {
  try {
    const res = await fetch('/api/config/revealTimestamp');
    if (!res.ok) throw new Error();
    const data = await res.json();
    revealTimestamp.value = Number(data.value);
  } catch {
    revealTimestamp.value = null;
  } finally {
    revealLoaded.value = true;
  }
};

const canReveal = computed(() => {
  if (!revealLoaded.value) return false;
  if (!revealTimestamp.value) return true;
  return Date.now() >= revealTimestamp.value;
});

function generateMatrixContent() {
  return "Seguro que el contenido de este mensaje merece la pena :D";
}

const genericMessage = computed(() => ({
  name: "¡Vuelve más tarde!",
  author: "TakitosCorp",
  content: generateMatrixContent(),
  timestamp: Date.now(),
  color: "#E1D7F6"
}));

const openMessage = (message) => {
  lastPage.value = currentPage.value;
  if (!canReveal.value) {
    selectedMessage.value = genericMessage.value;
  } else {
    selectedMessage.value = message;
    markRead(message.id);
    message.read = true;
    if (matrixInterval) {
      clearInterval(matrixInterval);
      matrixInterval = null;
    }
  }
  showComposeForm.value = false;
};

const closeDetailOnOutsideClick = () => {
  selectedMessage.value = null;
};

onMounted(() => {
  fetchRevealTimestamp().then(() => {
    updateMessagesPerPage();
    window.addEventListener('resize', updateMessagesPerPage);
    fetchMessages();

    intervalId = setInterval(() => {
      now.value = Date.now();
      fetchNewMessages();
    }, 10000);
  });
  updateContainerWidth();
  window.addEventListener('resize', updateContainerWidth);
  intervalId = setInterval(() => {
    now.value = Date.now();
  }, 1000);

  const syncRead = () => {
    const readIds = getReadIds();
    messages.value.forEach(msg => {
      msg.read = readIds.includes(msg.id);
    });
  };
  window.addEventListener('storage', syncRead);
});

onUnmounted(() => {
  window.removeEventListener('resize', updateMessagesPerPage);
  window.removeEventListener('resize', updateContainerWidth);
  if (intervalId) clearInterval(intervalId);
  window.removeEventListener('storage', syncRead);
  if (matrixInterval) clearInterval(matrixInterval);
});

const transitionName = ref('slide-left');

const contentContainer = ref(null);
const containerWidth = ref(0);

const now = ref(Date.now());
let intervalId = null;

const fechaEspanol = computed(() => {
  const date = new Date(now.value);
  const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const diaSemana = diasSemana[date.getDay()];
  const dia = date.getDate().toString().padStart(2, '0');
  const mes = (date.getMonth() + 1).toString().padStart(2, '0');
  const horas = date.getHours().toString().padStart(2, '0');
  const minutos = date.getMinutes().toString().padStart(2, '0');
  return `${diaSemana} ${dia}/${mes} - ${horas}:${minutos}`;
});

const updateContainerWidth = () => {
  if (contentContainer.value) {
    containerWidth.value = contentContainer.value.clientWidth;
  }
};

const currentPageMessages = computed(() => {
  const start = currentPage.value * messagesPerPage.value;
  const end = start + messagesPerPage.value;
  return messages.value.slice(start, end);
});

const emptySlots = computed(() => {
  const count = currentPageMessages.value.length;
  return count < messagesPerPage.value ? messagesPerPage.value - count : 0;
});

const hasPreviousPage = computed(() => {
  return currentPage.value > 0;
});

const hasNextPage = computed(() => {
  return (currentPage.value + 1) * messagesPerPage.value < messages.value.length;
});

const previousPage = () => {
  if (hasPreviousPage.value) {
    transitionName.value = 'slide-right';
    currentPage.value--;
  }
};

const nextPage = () => {
  if (hasNextPage.value) {
    transitionName.value = 'slide-left';
    currentPage.value++;
  }
};
</script>
