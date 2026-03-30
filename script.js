// Carrega tarefas salvas no LocalStorage ou inicia com array vazio
let tarefas = JSON.parse(localStorage.getItem('tarefas')) || [];

// Controla qual tarefa está sendo editada (null = nenhuma)
let idEditando = null;

// Elementos do DOM
const formTarefa = document.getElementById('form-tarefa');
const inputTitulo = document.getElementById('titulo');
const inputDescricao = document.getElementById('descricao');
const inputData = document.getElementById('data');
const inputPrioridade = document.getElementById('prioridade');
const inputStatus = document.getElementById('status');
const btnSalvar = document.getElementById('btn-salvar');
const btnCancelar = document.getElementById('btn-cancelar-edicao');
const listaTarefas = document.getElementById('lista-tarefas');
const inputBusca = document.getElementById('busca');
const filtroPrioridade = document.getElementById('filtro-prioridade');
const filtroStatus = document.getElementById('filtro-status');
const ordenacao = document.getElementById('ordenacao');

// Feedback
const mensagemFeedback = document.createElement('p');
mensagemFeedback.id = 'mensagem-feedback';
mensagemFeedback.style.marginTop = '6px';
mensagemFeedback.style.fontSize = '14px';
mensagemFeedback.style.fontWeight = '600';
mensagemFeedback.style.minHeight = '20px';

const actions = formTarefa.querySelector('.actions');
actions.insertAdjacentElement('afterend', mensagemFeedback);

renderizarTarefas();
atualizarMetricas();

// Salvar ou atualizar a tarefa
formTarefa.addEventListener('submit', function (e) {
  e.preventDefault();

  limparMensagem();

  if (!inputTitulo.value.trim() || !inputDescricao.value.trim() || !inputData.value || !inputPrioridade.value) {
    exibirMensagem('Preencha todos os campos obrigatórios.', 'erro');
    return;
  }

  if (idEditando !== null) {
    const index = tarefas.findIndex(t => t.id === idEditando);

    if (index !== -1) {
      tarefas[index] = {
        id: idEditando,
        titulo: inputTitulo.value.trim(),
        descricao: inputDescricao.value.trim(),
        data: inputData.value,
        prioridade: inputPrioridade.value,
        status: inputStatus.value
      };
    }

    idEditando = null;
    btnSalvar.textContent = 'Salvar tarefa';
    btnCancelar.style.display = 'none';
    exibirMensagem('Tarefa atualizada com sucesso.', 'sucesso');
  } else {
    const novaTarefa = {
      id: Date.now(),
      titulo: inputTitulo.value.trim(),
      descricao: inputDescricao.value.trim(),
      data: inputData.value,
      prioridade: inputPrioridade.value,
      status: inputStatus.value
    };

    tarefas.push(novaTarefa);
    exibirMensagem('Tarefa adicionada com sucesso.', 'sucesso');
  }

  salvarNoLocalStorage();
  formTarefa.reset();
  inputStatus.value = 'Pendente';
  renderizarTarefas();
  atualizarMetricas();
});

// Cancelar edição
btnCancelar.addEventListener('click', function () {
  idEditando = null;
  formTarefa.reset();
  inputStatus.value = 'Pendente';
  btnSalvar.textContent = 'Salvar tarefa';
  btnCancelar.style.display = 'none';
  limparMensagem();
});

// Filtros e ordenação
inputBusca.addEventListener('input', renderizarTarefas);
filtroPrioridade.addEventListener('change', renderizarTarefas);
filtroStatus.addEventListener('change', renderizarTarefas);
ordenacao.addEventListener('change', renderizarTarefas);


function renderizarTarefas() {
  const termoBusca = inputBusca.value.toLowerCase();
  const prioridadeFiltro = filtroPrioridade.value;
  const statusFiltro = filtroStatus.value;
  const tipoOrdenacao = ordenacao.value;

  const filtradas = tarefas.filter(t => {
    const bateTexto = t.titulo.toLowerCase().includes(termoBusca);
    const batePrioridade = prioridadeFiltro === '' || t.prioridade === prioridadeFiltro;
    const bateStatus = statusFiltro === '' || t.status === statusFiltro;
    return bateTexto && batePrioridade && bateStatus;
  });

  if (tipoOrdenacao === 'data-asc') {
    filtradas.sort((a, b) => new Date(a.data) - new Date(b.data));
  } else if (tipoOrdenacao === 'data-desc') {
    filtradas.sort((a, b) => new Date(b.data) - new Date(a.data));
  }

  listaTarefas.innerHTML = '';

  if (filtradas.length === 0) {
    listaTarefas.innerHTML = `
      <div class="empty-state">
        <strong>Nenhuma tarefa encontrada</strong>
        <p>Tente ajustar os filtros ou cadastre uma nova tarefa.</p>
      </div>
    `;
    return;
  }

  filtradas.forEach(tarefa => {
    const card = document.createElement('article');
    card.className = 'task-item' + (tarefa.status === 'Concluída' ? ' concluida' : '');
    card.dataset.id = tarefa.id;

    const dataFormatada = tarefa.data
      ? new Date(tarefa.data + 'T00:00:00').toLocaleDateString('pt-BR')
      : '';

    const classeRiscado = tarefa.status === 'Concluída' ? 'riscado' : '';
    const checkboxMarcado = tarefa.status === 'Concluída' ? 'checked' : '';

    card.innerHTML = `
      <div class="task-check-wrap">
        <div 
          class="task-checkbox ${checkboxMarcado}" 
          onclick="alterarStatus(${tarefa.id})" 
          title="${tarefa.status === 'Pendente' ? 'Marcar como concluída' : 'Marcar como pendente'}">
        </div>
      </div>

      <div class="task-main">
        <div class="task-top">
          <div>
            <h4 class="task-title ${classeRiscado}">${tarefa.titulo}</h4>
          </div>
        </div>

        <p class="task-desc">${tarefa.descricao}</p>

        <div class="task-footer">
          <div class="task-meta">
            <span class="badge badge-${tarefa.prioridade.toLowerCase().replace('é', 'e')}">${tarefa.prioridade} prioridade</span>
            <span class="badge badge-${tarefa.status.toLowerCase().replace('í', 'i')}">${tarefa.status}</span>
          </div>
        </div>
      </div>

      <div class="task-actions-vertical">
        <div class="task-date-top">${dataFormatada}</div>
        <button class="icon-btn delete" onclick="excluirTarefa(${tarefa.id})" title="Excluir">🗑️</button>
        <button class="icon-btn edit" onclick="editarTarefa(${tarefa.id})" title="Editar">✏️</button>
      </div>
    `;

    listaTarefas.appendChild(card);
  });
}

// Checkbox
function alterarStatus(id) {
  const tarefa = tarefas.find(t => t.id === id);
  if (!tarefa) return;

  tarefa.status = tarefa.status === 'Pendente' ? 'Concluída' : 'Pendente';

  salvarNoLocalStorage();
  renderizarTarefas();
  atualizarMetricas();
}

// Editar tarefa
function editarTarefa(id) {
  const tarefa = tarefas.find(t => t.id === id);
  if (!tarefa) return;

  inputTitulo.value = tarefa.titulo;
  inputDescricao.value = tarefa.descricao;
  inputData.value = tarefa.data;
  inputPrioridade.value = tarefa.prioridade;
  inputStatus.value = tarefa.status;

  idEditando = id;
  btnSalvar.textContent = 'Atualizar tarefa';
  btnCancelar.style.display = 'inline-block';
  limparMensagem();

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Excluir tarefa
function excluirTarefa(id) {
  if (!confirm('Deseja excluir esta tarefa?')) return;

  tarefas = tarefas.filter(t => t.id !== id);
  salvarNoLocalStorage();
  renderizarTarefas();
  atualizarMetricas();

  alert('Tarefa excluída com sucesso, visse?');
}

// Atualizar métricas
function atualizarMetricas() {
  document.getElementById('total-tarefas').textContent = tarefas.length;
  document.getElementById('total-pendentes').textContent = tarefas.filter(t => t.status === 'Pendente').length;
  document.getElementById('total-concluidas').textContent = tarefas.filter(t => t.status === 'Concluída').length;
  document.getElementById('total-alta').textContent = tarefas.filter(t => t.prioridade === 'Alta').length;
}

function salvarNoLocalStorage() {
  localStorage.setItem('tarefas', JSON.stringify(tarefas));
}

// Feedback para o usuário após ações como salvar, atualizar ou excluir tarefas
function exibirMensagem(texto, tipo) {
  mensagemFeedback.textContent = texto;
  mensagemFeedback.style.color = tipo === 'erro' ? '#EF4444' : '#22C55E';
}

function limparMensagem() {
  mensagemFeedback.textContent = '';
}