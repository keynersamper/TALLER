const POSTS_URL = 'https://jsonplaceholder.typicode.com/posts';
const USERS_URL = 'https://jsonplaceholder.typicode.com/users';
// Referencias al DOM principales
const postsContainer = document.getElementById('posts-container');
const loadingSpinner = document.getElementById('loading-spinner');
const errorMessage = document.getElementById('error-message');
const searchInput = document.getElementById('search-input');
// Referencias al DOM del Modal y Formulario
const openModalBtn = document.getElementById('open-modal-btn');
const closeModalBtn = document.getElementById('close-modal-btn');
const postModal = document.getElementById('post-modal');
const newPostForm = document.getElementById('new-post-form');
const newTitleInput = document.getElementById('new-title');
const newBodyInput = document.getElementById('new-body');

const userModal = document.getElementById('user-modal');
const closeUserModalBtn = document.getElementById('close-user-modal-btn');
const userDetails = document.getElementById('user-details');

let allUsers = [];

let allPosts = [];

/**
 * Inicializar aplicación cargando datos GET
 */
async function initApp() {
    showLoading(true);
    showError(false); // Corregido: Oculta el error al iniciar correctamente


    try {
        // Realizamos peticiones en paralelo usando Promise.all
        const [postsResponse, usersResponse] = await Promise.all([
            fetch(POSTS_URL),
            fetch(USERS_URL)
        ]);

        if (!postsResponse.ok || !usersResponse.ok) {
            throw new Error('Error al conectar con el servidor.');
        }

        const posts = await postsResponse.json();
        const users = await usersResponse.json();
        allUsers= users;

        // Mapeamos los posts para adjuntar el nombre del autor
        allPosts = posts.map(post => {
            const author = users.find(user => user.id === post.userId);
            return {
                ...post,
                authorName: author ? author.name : 'Usuario Desconocido'
            };
        });

        // Renderizamos las tarjetas en el DOM
        renderPosts(allPosts);

    } catch (error) {
        console.error('Hubo un problema:', error);
        showError(true);
    } finally {
        showLoading(false);
    }
}

/**
 * Renderizar tarjetas en el DOM
 */
function escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function renderPosts(postsToRender) {
    if (postsToRender.length === 0) {
        postsContainer.innerHTML = `<p class="no-results" style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">No se encontraron publicaciones.</p>`;
        return;
    }

    postsContainer.innerHTML = postsToRender.map(post => `
        <article class="post-card" data-user-id="${post.userId}" tabindex="0" role="button"
                 aria-label="Ver datos del autor ${escapeHTML(post.authorName)}">
            <div>
                <h2 class="post-title">${escapeHTML(post.title)}</h2>
                <p class="post-body">${escapeHTML(post.body)}</p>
            </div>
            <span class="post-author">✍️ ${escapeHTML(post.authorName)}</span>
        </article>
    `).join('');
}

/**
 * Manejo del Modal (Abrir y Cerrar)
 */
openModalBtn.addEventListener('click', () => {
    postModal.classList.remove('hidden');
    newTitleInput.focus();
});

closeModalBtn.addEventListener('click', () => {
    postModal.classList.add('hidden');
});

// Cerrar si se hace clic fuera del contenido del modal
window.addEventListener('click', (e) => {
    if (e.target === postModal) {
        postModal.classList.add('hidden');
    }
});

/**
 * Enviar Nueva Publicación mediante Petición POST
 */
newPostForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = newTitleInput.value.trim();
    const body = newBodyInput.value.trim();

    if (!title || !body) return;

    const newPostPayload = {
        title: title,
        body: body,
        userId: 1 // Simulamos que el usuario actual tiene ID 1
    };

    try {
        const response = await fetch(POSTS_URL, {
            method: 'POST',
            body: JSON.stringify(newPostPayload),
            headers: {
                'Content-type': 'application/json; charset=UTF-8',
            },
        });

        if (!response.ok) {
            throw new Error('Error al registrar la publicación en el servidor.');
        }

        const createdPost = await response.json();
        createdPost.authorName = 'Tú (Autor Actual)';

        // Insertamos el nuevo post al inicio del arreglo global
        allPosts.unshift(createdPost);

        // Volvemos a renderizar la interfaz
        renderPosts(allPosts);

        // Limpiamos formulario y cerramos modal
        newPostForm.reset();
        postModal.classList.add('hidden');

        alert('¡Publicación creada exitosamente!');

    } catch (error) {
        console.error('Error al enviar POST:', error);
        alert('No se pudo crear la publicación. Inténtalo de nuevo.');
    }
});
/**
 * Buscador en tiempo real
 */
searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase().trim();

    const filteredPosts = allPosts.filter(post => 
        post.title.toLowerCase().includes(searchTerm) || 
        post.body.toLowerCase().includes(searchTerm)
    );

    renderPosts(filteredPosts);
});
// Funciones auxiliares de UI (Control de estados)
function showLoading(isLoading) {
    if (isLoading) {
        loadingSpinner.classList.remove('hidden');
    } else {
        loadingSpinner.classList.add('hidden');
    }
}
function showError(hasError) {
    if (hasError) {
        errorMessage.classList.remove('hidden');
    } else {
        errorMessage.classList.add('hidden');
    }
}

function showUserModal(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;

    const fields = [
        ['ID', user.id],
        ['Nombre', user.name],
        ['Username', user.username],
        ['Email', user.email],
        ['Teléfono', user.phone],
        ['Website', user.website]
    ];

    userDetails.innerHTML = fields.map(([label, value]) => `
        <dt>${label}</dt>
        <dd>${escapeHTML(String(value))}</dd>
    `).join('');

    userModal.classList.remove('hidden');
}

function closeUserModal() {
    userModal.classList.add('hidden');
}

postsContainer.addEventListener('click', (e) => {
    const card = e.target.closest('.post-card');
    if (card) showUserModal(Number(card.dataset.userId));
});

postsContainer.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const card = e.target.closest('.post-card');
    if (card) {
        e.preventDefault();
        showUserModal(Number(card.dataset.userId));
    }
});

closeUserModalBtn.addEventListener('click', closeUserModal);

userModal.addEventListener('click', (e) => {
    if (e.target === userModal) closeUserModal();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeUserModal();
        postModal.classList.add('hidden');
    }
});
// Inicializar al cargar el DOM
document.addEventListener('DOMContentLoaded', initApp);