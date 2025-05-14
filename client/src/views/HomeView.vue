<template>
  <div class="min-h-screen bg-gradient-to-b from-gray-200 to-gray-300 flex flex-col">
    <!-- Contenedor principal con transición solo para el contenido, no para la barra inferior -->
    <div class="flex-1 relative overflow-hidden">
      <transition name="fade" mode="out-in">
        <!-- Vista de grid de mensajes -->
        <div v-if="!selectedMessage" key="grid" class="absolute inset-0 flex flex-col items-center justify-center">
          <transition :name="transitionName" mode="out-in">
            <div :key="currentPage" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 sm:gap-7 p-3 sm:p-10 w-full max-w-6xl mx-auto px-3 sm:px-24">
              <div v-for="message in currentPageMessages" :key="message.id" class="relative cursor-pointer transform hover:scale-105 transition-transform" @click="openMessage(message)">
                <div class="w-full h-32 sm:h-36 rounded-md shadow-md flex items-center justify-center" :style="{ backgroundColor: message.color || '#FFFFC9' }">
                  <div class="w-full h-full relative">
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
                      <span class="text-gray-700 text-lg sm:text-2xl font-light">{{ message.name }}</span>
                    </div>
                    <div v-if="!message.read" class="absolute -top-2 left-1/2 transform -translate-x-1/2">
                      <div class="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-red-500 to-red-600 border-2 border-white shadow-md animate-pulse"></div>
                    </div>
                    <div v-else class="absolute -top-2 left-1/2 transform -translate-x-1/2">
                      <div class="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 border-2 border-white shadow-md"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div v-for="i in emptySlots" :key="`empty-${i}`" class="w-full h-32 sm:h-36"></div>
            </div>
          </transition>
          <button v-if="hasPreviousPage" @click="previousPage" class="absolute left-3 sm:left-10 top-1/2 transform hover:scale-105 transition-transform -translate-y-1/2 z-10 cursor-pointer">
            <img src="@/assets/left.png" alt="Anterior" class="h-14 w-14" />
          </button>
          <button v-if="hasNextPage" @click="nextPage" class="absolute right-3 sm:right-10 top-1/2 transform hover:scale-105 transition-transform -translate-y-1/2 z-10 cursor-pointer">
            <img src="@/assets/right.png" alt="Siguiente" class="h-14 w-14" />
          </button>
        </div>
        
        <!-- Vista de detalle del mensaje -->
        <div v-else key="detail" class="absolute inset-0 flex flex-col items-center justify-center p-0 sm:p-5">
          <div class="w-full max-w-4xl bg-white rounded-xl shadow-lg overflow-hidden flex flex-col" style="min-height:0;">
            <div class="bg-gray-400 text-white text-center py-3 sm:py-4 px-3 sm:px-5 text-xl sm:text-3xl font-light">
              {{ selectedMessage.name }}
            </div>
            <div class="flex-1 bg-white flex flex-col overflow-hidden">
              <!-- Todo el contenido ahora está dentro del área scrollable -->
              <div ref="contentContainer" class="flex-1 relative overflow-y-auto hide-scrollbar">
                <div class="p-3 sm:p-7">
                  <!-- Contenido del mensaje -->
                  <div class="pl-2 sm:pl-[38px] text-gray-700 text-lg sm:text-2xl font-light">
                    <div class="lined-paper">
                      <p v-for="(line, index) in renderedLines" :key="index" class="line">
                        {{ line || '​' }}
                      </p>
                    </div>
                  </div>
                  
                  <!-- Pie del mensaje (fecha y autor) ahora dentro del área scrollable -->
                  <div class="mt-8 mb-4">
                    <div class="text-right text-gray-500 pr-3 sm:pr-5 pb-1 text-base sm:text-lg">
                      {{ fechaEspanol }}
                    </div>
                    <div class="text-right text-gray-400 pr-3 sm:pr-5 text-lg sm:text-2xl font-light">
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
    
    <!-- Barra inferior más grande -->
    <div class="h-12 sm:h-14 bg-gray-200 border-t border-gray-300 flex items-center justify-between px-3 sm:px-5 sticky bottom-0 z-20">
      <div class="flex items-center">
        <button @click="composeMessage" class="w-9 h-9 sm:w-11 sm:h-11 bg-blue-100 rounded-full border-4 border-blue-300 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform">
          <div class="w-5 h-5 sm:w-6 sm:h-6 bg-transparent flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="4" width="20" height="16" rx="2"></rect>
              <path d="M22 7l-10 5-10-5"></path>
            </svg>
          </div>
        </button>
      </div>
      <div class="text-gray-500 text-base sm:text-lg font-light">
        {{ fechaEspanol }}
      </div>
      <div class="flex items-center">
        <button @click="goHome" class="w-9 h-9 sm:w-11 sm:h-11 bg-blue-100 rounded-full border-4 border-blue-300 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform">
          <div class="w-5 h-5 sm:w-6 sm:h-6 bg-transparent flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
import { ref, computed, onMounted, watch, onUnmounted } from 'vue';

const messages = ref([
  {
    id: 1,
    name: 'Alex',
    content: 'Hola, ¿cómo estás? Espero que todo vaya bien. Este es un mensaje de prueba para mostrar cómo se vería el contenido en la vista de detalle del mensaje.\n\nEl estilo de folio rallado hace que sea más fácil de leer y se parece mucho al estilo original de Wii.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque euismod, nisi eu consectetur cursus, nisl erat dictum enim, nec facilisis enim erat nec urna. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Integer ac sem nec urna cursus faucibus. Suspendisse potenti.\n\nMauris euismod, sapien nec laoreet cursus, enim erat dictum enim, nec facilisis enim erat nec urna. Proin euismod, nisi eu consectetur cursus, nisl erat dictum enim, nec facilisis enim erat nec urna. Etiam euismod, sapien nec laoreet cursus, enim erat dictum enim, nec facilisis enim erat nec urna.',
    color: '#FFFFC9',
    read: false,
    author: 'Alex García',
    timestamp: 1719852000000
  },
  {
    id: 2,
    name: 'Diario...',
    content: 'Hoy jugué New SUPER MARIO BROS durante 23:59 horas. Fue un día muy productivo.\n\nTambién completé varios niveles y conseguí todas las monedas estrella.',
    color: '#FFFFFF',
    read: false,
    author: 'Diario Personal',
    timestamp: 1719848400000
  },
  {
    id: 3,
    name: 'María',
    content: 'Recordatorio: Tenemos una reunión mañana a las 10:00. No olvides traer los documentos que preparamos la semana pasada.',
    color: '#E6F7FF',
    read: false,
    author: 'María López',
    timestamp: 1719844800000
  },
  {
    id: 4,
    name: 'Juan',
    content: '¿Viste el partido de ayer? ¡Fue increíble! Tenemos que hablar sobre eso cuando nos veamos.',
    color: '#FFECB3',
    read: false,
    author: 'Juan Pérez',
    timestamp: 1719841200000
  },
  {
    id: 5,
    name: 'Recordatorio',
    content: 'No olvides comprar leche y pan cuando vuelvas del trabajo.',
    color: '#E8F5E9',
    read: false,
    author: 'Notas',
    timestamp: 1719837600000
  },
  {
    id: 6,
    name: 'Trabajo',
    content: 'El informe trimestral debe ser entregado antes del viernes. Por favor revisa los números una vez más.',
    color: '#F3E5F5',
    read: false,
    author: 'Oficina',
    timestamp: 1719834000000
  },
  {
    id: 7,
    name: 'Cumpleaños',
    content: 'El cumpleaños de mamá es el próximo sábado. Debemos organizar una pequeña sorpresa.',
    color: '#FFCDD2',
    read: false,
    author: 'Calendario',
    timestamp: 1719830400000
  },
  {
    id: 8,
    name: 'Vacaciones',
    content: 'Las reservaciones para el hotel están confirmadas. Salimos el 15 de julio y volvemos el 22.',
    color: '#FFF9C4',
    read: false,
    author: 'Agencia de Viajes',
    timestamp: 1719826800000
  }
]);

const selectedMessage = ref(null);
const lastPage = ref(0); // Guardamos la última página visitada

const currentPage = ref(0);
const messagesPerPage = 6;

const transitionName = ref('slide-left');

const contentContainer = ref(null);
const containerWidth = ref(0);
const contentHeight = ref(0);

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

// Líneas renderizadas - mantenemos este enfoque para tener una línea debajo de cada línea de texto
const renderedLines = ref([]);

const calculateLines = () => {
  if (!selectedMessage.value) {
    renderedLines.value = [];
    return;
  }
  
  // Dividimos por párrafos primero
  const paragraphs = selectedMessage.value.content.split('\n');
  const lines = [];
  
  // Para cada párrafo, creamos líneas basadas en el ancho del contenedor
  paragraphs.forEach(paragraph => {
    if (paragraph === '') {
      lines.push(''); // Línea vacía para párrafos vacíos
      return;
    }
    
    const maxCharsPerLine = getMaxCharsPerLine();
    
    if (paragraph.length <= maxCharsPerLine) {
      lines.push(paragraph);
    } else {
      // Dividimos párrafos largos en múltiples líneas
      let remainingText = paragraph;
      while (remainingText.length > 0) {
        let breakPoint = Math.min(maxCharsPerLine, remainingText.length);
        
        // Intentamos romper en un espacio si es posible
        if (breakPoint < remainingText.length) {
          const lastSpace = remainingText.substring(0, breakPoint).lastIndexOf(' ');
          if (lastSpace > 0) {
            breakPoint = lastSpace + 1;
          }
        }
        
        lines.push(remainingText.substring(0, breakPoint));
        remainingText = remainingText.substring(breakPoint).trim();
      }
    }
  });
  
  renderedLines.value = lines;
};

watch([selectedMessage, containerWidth], () => {
  calculateLines();
});

const getMaxCharsPerLine = () => {
  if (!containerWidth.value) return 60;
  const fontSize = window.innerWidth < 640 ? 18 : 22; // Aumentado el tamaño de fuente
  const avgCharWidth = fontSize * 0.55;
  const availableWidth = containerWidth.value - 90; // Ajustado para el nuevo padding
  return Math.floor(availableWidth / avgCharWidth);
};

const currentPageMessages = computed(() => {
  const start = currentPage.value * messagesPerPage;
  const end = start + messagesPerPage;
  return messages.value.slice(start, end);
});

const emptySlots = computed(() => {
  const count = currentPageMessages.value.length;
  return count < messagesPerPage ? messagesPerPage - count : 0;
});

const hasPreviousPage = computed(() => {
  return currentPage.value > 0;
});

const hasNextPage = computed(() => {
  return (currentPage.value + 1) * messagesPerPage < messages.value.length;
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

const openMessage = (message) => {
  // Guardamos la página actual antes de abrir el mensaje
  lastPage.value = currentPage.value;
  
  selectedMessage.value = message;
  message.read = true;
  containerWidth.value = 0;
  contentHeight.value = 0;
  setTimeout(updateContainerWidth, 100);
};

const composeMessage = () => {
  alert('Redactar nuevo mensaje');
};

const goHome = () => {
  if (selectedMessage.value) {
    // Si estamos viendo un mensaje, volvemos a la última página visitada
    selectedMessage.value = null;
    currentPage.value = lastPage.value;
  } else {
    // Si ya estamos en la vista de grid, volvemos a la primera página
    currentPage.value = 0;
  }
};

const updateContainerWidth = () => {
  if (contentContainer.value) {
    containerWidth.value = contentContainer.value.clientWidth;
  }
};

onMounted(() => {
  updateContainerWidth();
  window.addEventListener('resize', updateContainerWidth);
  calculateLines();
  intervalId = setInterval(() => {
    now.value = Date.now();
  }, 1000);
});

onUnmounted(() => {
  window.removeEventListener('resize', updateContainerWidth);
  if (intervalId) clearInterval(intervalId);
});

watch(containerWidth, () => {
  calculateLines();
});
</script>

<style>
html {
  cursor: url('/wii-open-ccw.cur'), auto;
}

button,
a,
input[type="button"],
input[type="submit"],
input[type="reset"],
[role="button"],
[tabindex]:not([tabindex="-1"]),
.cursor-pointer,
.cursor-pointer * {
  cursor: url('/wii-pointer-ccw.cur'), pointer !important;
}

body::-webkit-scrollbar {
  width: 0px;
}

.hide-scrollbar {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.hide-scrollbar::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}

/* Estilo mejorado para el papel con líneas - texto pegado a la línea */
.lined-paper {
  position: relative;
  width: 100%;
}

.lined-paper .line {
  position: relative;
  height: 2.2em; /* Altura para cada línea */
  line-height: 1.5;
  margin: 0;
  padding: 0 0 0 0; /* Padding eliminado completamente */
  display: flex;
  align-items: flex-end; /* Alineamos el texto con la parte inferior */
  overflow: visible;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.lined-paper .line::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: -20px;
  right: 0;
  height: 1px;
  background-color: #e5e7eb; /* Tailwind gray-300 */
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }

  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }

  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.animate-pulse {
  animation: pulse 1.5s infinite;
}

/* Transiciones para la navegación entre páginas */
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.3s ease-out;
}

.slide-left-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

.slide-right-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.slide-right-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

/* Transición de fade mejorada */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.35s ease, transform 0.35s ease;
  position: absolute;
  width: 100%;
  height: 100%;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: scale(0.98);
}

/* Media queries para mejorar la responsividad */
@media (max-width: 640px) {
  .lined-paper .line {
    height: 2em;
    font-size: 1.1rem;
  }
}

@media (max-width: 480px) {
  .lined-paper .line {
    height: 1.8em;
    font-size: 1rem;
  }
}

@media (max-width: 380px) {
  .lined-paper .line::after {
    left: -10px;
  }
}
</style>