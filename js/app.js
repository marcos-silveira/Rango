/**
 * Rango - Controle Semanal de Marmitas
 * Frontend puro com persistência via LocalStorage.
 */

// Chaves do LocalStorage
const STORAGE_KEYS = {
  MARMITAS: 'rango_marmitas_data',
  PRICES: 'rango_default_prices',
};

// Dias da semana em português
const DAYS_OF_WEEK = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado'
];

// Configurações padrão iniciais
const DEFAULT_PRICES = {
  M: 18.00,
  P: 9.00
};

// Formatação monetária BRL
const formatMoney = (val) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(val || 0);
};

// Obter dia atual da semana
const getCurrentDayOfWeek = () => {
  const dayIndex = new Date().getDay();
  return DAYS_OF_WEEK[dayIndex];
};

// Estado da Aplicação
class MarmitasApp {
  constructor() {
    this.prices = this.loadPrices();
    this.marmitas = this.loadMarmitas();

    this.initDOMElements();
    this.bindEvents();
    this.render();
  }

  // Carrega preços do LocalStorage ou usa padrão
  loadPrices() {
    const saved = localStorage.getItem(STORAGE_KEYS.PRICES);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          M: Number(parsed.M) || DEFAULT_PRICES.M,
          P: Number(parsed.P) || DEFAULT_PRICES.P
        };
      } catch (e) {
        console.error('Erro ao ler preços salvos:', e);
      }
    }
    return { ...DEFAULT_PRICES };
  }

  // Salva preços no LocalStorage
  savePrices(newPrices) {
    this.prices = {
      M: Number(newPrices.M),
      P: Number(newPrices.P)
    };
    localStorage.setItem(STORAGE_KEYS.PRICES, JSON.stringify(this.prices));
    this.updatePriceDisplays();
    this.showToast('Preços padrão atualizados com sucesso!');
  }

  // Carrega marmitas salvas
  loadMarmitas() {
    const saved = localStorage.getItem(STORAGE_KEYS.MARMITAS);
    if (saved) {
      try {
        return JSON.parse(saved) || [];
      } catch (e) {
        console.error('Erro ao carregar marmitas salvas:', e);
      }
    }
    return [];
  }

  // Salva marmitas no LocalStorage
  persistMarmitas() {
    localStorage.setItem(STORAGE_KEYS.MARMITAS, JSON.stringify(this.marmitas));
  }

  // Adiciona nova marmita
  addMarmita({ dayOfWeek, size, price, obs }) {
    const newEntry = {
      id: 'marmita_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      dayOfWeek: dayOfWeek || getCurrentDayOfWeek(),
      size: size || 'M',
      price: Number(price) || (size === 'P' ? this.prices.P : this.prices.M),
      obs: obs ? obs.trim() : '',
      createdAt: new Date().toISOString()
    };

    // Insere no início da lista
    this.marmitas.unshift(newEntry);
    this.persistMarmitas();
    this.render();
    this.showToast(`Marmita ${newEntry.size} adicionada! (${formatMoney(newEntry.price)})`);
  }

  // Remove marmita por ID
  deleteMarmita(id) {
    const target = this.marmitas.find(m => m.id === id);
    this.marmitas = this.marmitas.filter(m => m.id !== id);
    this.persistMarmitas();
    this.render();
    if (target) {
      this.showToast(`Marmita ${target.size} de ${target.dayOfWeek} removida.`);
    }
  }

  // Marcar como pago e limpar tudo
  markAllAsPaid() {
    const count = this.marmitas.length;
    this.marmitas = [];
    this.persistMarmitas();
    this.render();
    this.showToast(`Tudo pago! ${count} marmita(s) quitada(s) e lista zerada.`);
  }

  // Inicializa referências DOM
  initDOMElements() {
    // Header & Resumos
    this.totalAmountEl = document.getElementById('totalAmount');
    this.summaryBreakdownEl = document.getElementById('summaryBreakdown');
    this.listCounterEl = document.getElementById('listCounter');
    this.marmitasListContainer = document.getElementById('marmitasListContainer');

    // Botões principais
    this.btnOpenModal = document.getElementById('btnOpenModal');
    this.btnMarkPaid = document.getElementById('btnMarkPaid');
    this.btnOpenSettings = document.getElementById('btnOpenSettings');

    // Atalhos rápidos
    this.btnQuickAddM = document.getElementById('btnQuickAddM');
    this.btnQuickAddP = document.getElementById('btnQuickAddP');

    // Modais
    this.modalAdd = document.getElementById('modalAdd');
    this.btnCloseAddModal = document.getElementById('btnCloseAddModal');
    this.btnCancelAdd = document.getElementById('btnCancelAdd');
    this.formAddMarmita = document.getElementById('formAddMarmita');
    this.inputDayOfWeek = document.getElementById('inputDayOfWeek');
    this.inputValue = document.getElementById('inputValue');
    this.inputObs = document.getElementById('inputObs');

    this.modalSettings = document.getElementById('modalSettings');
    this.btnCloseSettingsModal = document.getElementById('btnCloseSettingsModal');
    this.btnCancelSettings = document.getElementById('btnCancelSettings');
    this.formSettings = document.getElementById('formSettings');
    this.settingPriceM = document.getElementById('settingPriceM');
    this.settingPriceP = document.getElementById('settingPriceP');

    this.modalConfirmPaid = document.getElementById('modalConfirmPaid');
    this.btnCloseConfirmModal = document.getElementById('btnCloseConfirmModal');
    this.btnCancelPaid = document.getElementById('btnCancelPaid');
    this.btnConfirmPaidAction = document.getElementById('btnConfirmPaidAction');
    this.confirmPaidAmount = document.getElementById('confirmPaidAmount');

    // Toast
    this.toastEl = document.getElementById('toast');
    this.toastTimeout = null;
  }

  // Vincula ouvintes de eventos
  bindEvents() {
    // Abrir Modal de Adição
    this.btnOpenModal.addEventListener('click', () => {
      this.openAddModal();
    });

    // Fechar Modal de Adição
    this.btnCloseAddModal.addEventListener('click', () => this.closeModal(this.modalAdd));
    this.btnCancelAdd.addEventListener('click', () => this.closeModal(this.modalAdd));

    // Troca de tamanho de marmita no formulário atualiza o valor automaticamente
    const radioSizes = this.formAddMarmita.querySelectorAll('input[name="marmitaSize"]');
    radioSizes.forEach(radio => {
      radio.addEventListener('change', (e) => {
        const chosenSize = e.target.value;
        this.inputValue.value = (chosenSize === 'P' ? this.prices.P : this.prices.M).toFixed(2);
      });
    });

    // Submissão do formulário de adição
    this.formAddMarmita.addEventListener('submit', (e) => {
      e.preventDefault();
      const selectedRadio = this.formAddMarmita.querySelector('input[name="marmitaSize"]:checked');
      const size = selectedRadio ? selectedRadio.value : 'M';
      const dayOfWeek = this.inputDayOfWeek.value;
      const price = parseFloat(this.inputValue.value);
      const obs = this.inputObs.value;

      this.addMarmita({ dayOfWeek, size, price, obs });
      this.closeModal(this.modalAdd);
    });

    // Atalhos rápidos para o dia de hoje
    this.btnQuickAddM.addEventListener('click', () => {
      this.addMarmita({
        dayOfWeek: getCurrentDayOfWeek(),
        size: 'M',
        price: this.prices.M
      });
    });

    this.btnQuickAddP.addEventListener('click', () => {
      this.addMarmita({
        dayOfWeek: getCurrentDayOfWeek(),
        size: 'P',
        price: this.prices.P
      });
    });

    // Abrir Modal de Configurações
    this.btnOpenSettings.addEventListener('click', () => {
      this.settingPriceM.value = this.prices.M.toFixed(2);
      this.settingPriceP.value = this.prices.P.toFixed(2);
      this.openModal(this.modalSettings);
    });

    this.btnCloseSettingsModal.addEventListener('click', () => this.closeModal(this.modalSettings));
    this.btnCancelSettings.addEventListener('click', () => this.closeModal(this.modalSettings));

    // Salvar novas configurações de preços padrão
    this.formSettings.addEventListener('submit', (e) => {
      e.preventDefault();
      const newM = parseFloat(this.settingPriceM.value);
      const newP = parseFloat(this.settingPriceP.value);

      if (isNaN(newM) || isNaN(newP) || newM < 0 || newP < 0) {
        alert('Por favor, informe valores válidos para as marmitas.');
        return;
      }

      this.savePrices({ M: newM, P: newP });
      this.closeModal(this.modalSettings);
    });

    // Marcar como Pago (abre modal de confirmação)
    this.btnMarkPaid.addEventListener('click', () => {
      if (this.marmitas.length === 0) return;
      const total = this.calculateTotal();
      this.confirmPaidAmount.textContent = formatMoney(total);
      this.openModal(this.modalConfirmPaid);
    });

    this.btnCloseConfirmModal.addEventListener('click', () => this.closeModal(this.modalConfirmPaid));
    this.btnCancelPaid.addEventListener('click', () => this.closeModal(this.modalConfirmPaid));

    this.btnConfirmPaidAction.addEventListener('click', () => {
      this.markAllAsPaid();
      this.closeModal(this.modalConfirmPaid);
    });

    // Fechar modais ao clicar no fundo escuro
    [this.modalAdd, this.modalSettings, this.modalConfirmPaid].forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeModal(modal);
        }
      });
    });

    // Fechar modais com tecla ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeModal(this.modalAdd);
        this.closeModal(this.modalSettings);
        this.closeModal(this.modalConfirmPaid);
      }
    });

    // Exclusão individual via delegação de eventos
    this.marmitasListContainer.addEventListener('click', (e) => {
      const deleteBtn = e.target.closest('.btn-delete-item');
      if (deleteBtn) {
        const id = deleteBtn.getAttribute('data-id');
        if (id) {
          this.deleteMarmita(id);
        }
      }
    });
  }

  // Abre modal de adição com valores padrão e dia atual
  openAddModal() {
    // Inicializa com o dia atual da semana
    this.inputDayOfWeek.value = getCurrentDayOfWeek();

    // Seleciona tamanho M por padrão
    const radioM = this.formAddMarmita.querySelector('input[name="marmitaSize"][value="M"]');
    if (radioM) radioM.checked = true;

    // Define o valor padrão da M
    this.inputValue.value = this.prices.M.toFixed(2);
    this.inputObs.value = '';

    // Atualiza rótulos de preços no modal
    this.updatePriceDisplays();

    this.openModal(this.modalAdd);
  }

  openModal(modal) {
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
  }

  closeModal(modal) {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
  }

  // Atualiza indicadores de preço na tela
  updatePriceDisplays() {
    const labelPriceM = document.getElementById('labelPriceM');
    const labelPriceP = document.getElementById('labelPriceP');
    if (labelPriceM) labelPriceM.textContent = formatMoney(this.prices.M);
    if (labelPriceP) labelPriceP.textContent = formatMoney(this.prices.P);

    document.querySelectorAll('.price-m-display').forEach(el => {
      el.textContent = formatMoney(this.prices.M);
    });
    document.querySelectorAll('.price-p-display').forEach(el => {
      el.textContent = formatMoney(this.prices.P);
    });
  }

  // Calcula total monetário
  calculateTotal() {
    return this.marmitas.reduce((acc, curr) => acc + (Number(curr.price) || 0), 0);
  }

  // Notificação Toast amigável
  showToast(message) {
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    this.toastEl.textContent = message;
    this.toastEl.classList.add('show');

    this.toastTimeout = setTimeout(() => {
      this.toastEl.classList.remove('show');
    }, 3200);
  }

  // Renderiza toda a interface
  render() {
    this.updatePriceDisplays();

    const total = this.calculateTotal();
    const countTotal = this.marmitas.length;
    const countM = this.marmitas.filter(m => m.size === 'M').length;
    const countP = this.marmitas.filter(m => m.size === 'P').length;

    // Atualiza valor total
    this.totalAmountEl.textContent = formatMoney(total);

    // Resumo descritivo
    if (countTotal === 0) {
      this.summaryBreakdownEl.textContent = 'Nenhuma marmita pendente nesta semana';
      this.btnMarkPaid.disabled = true;
      this.listCounterEl.textContent = '0 lançamentos';
    } else {
      this.summaryBreakdownEl.textContent = `${countTotal} marmita${countTotal > 1 ? 's' : ''} nesta semana (${countM} M • ${countP} P)`;
      this.btnMarkPaid.disabled = false;
      this.listCounterEl.textContent = `${countTotal} lançamento${countTotal > 1 ? 's' : ''}`;
    }

    // Renderiza lista de marmitas
    if (countTotal === 0) {
      this.marmitasListContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🎉</div>
          <h3>Tudo em dia!</h3>
          <p>Nenhuma marmita pendente para acertar. Quando sua irmã trouxer uma marmita, clique em <strong>Lançar Marmita</strong> acima.</p>
        </div>
      `;
      return;
    }

    let html = '';
    this.marmitas.forEach(item => {
      const formattedDate = item.createdAt ? new Date(item.createdAt).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }) : '';

      html += `
        <article class="marmita-item" data-id="${item.id}">
          <div class="item-left">
            <span class="item-badge badge-${item.size}">${item.size}</span>
            <div class="item-details">
              <span class="item-day">${item.dayOfWeek}</span>
              <span class="item-meta">
                Marmita ${item.size === 'M' ? 'Média' : 'Pequena'}
                ${item.obs ? `• <em>${this.escapeHtml(item.obs)}</em>` : ''}
                ${formattedDate ? `• ${formattedDate}` : ''}
              </span>
            </div>
          </div>
          <div class="item-right">
            <span class="item-price">${formatMoney(item.price)}</span>
            <button class="btn-delete-item" data-id="${item.id}" title="Excluir este lançamento" aria-label="Excluir marmita">
              🗑️
            </button>
          </div>
        </article>
      `;
    });

    this.marmitasListContainer.innerHTML = html;
  }

  // Previne injeção de HTML simples em observações
  escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

// Inicia aplicação após carregamento da página
document.addEventListener('DOMContentLoaded', () => {
  window.rangoApp = new MarmitasApp();
});

// Registra Service Worker para suporte completo a PWA e Offline
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js')
      .then((reg) => {
        console.log('🍱 Rango PWA pronto e registrado:', reg.scope);
      })
      .catch((err) => {
        console.warn('Falha ao registrar Service Worker do PWA:', err);
      });
  });
}

