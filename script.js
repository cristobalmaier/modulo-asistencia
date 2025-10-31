// Sistema de Gestión de Asistencias - JavaScript

// Definición de roles y permisos
const roles = {
    admin: {
        name: 'ADMIN',
        permissions: {
            pasarLista: true,
            verInforme: true,
            calendario: true,
            historial: true,
            todasVistas: true
        },
        navItems: ['pasar lista', 'ver informe', 'calendario', 'historial']
    },
    preceptor: {
        name: 'Preceptor',
        permissions: {
            pasarLista: true,
            verInforme: true,
            calendario: true,
            historial: true,
            editarCurso: true,
            verColoresCursos: true,
            descargarInforme: true
        },
        navItems: ['pasar lista', 'ver informe', 'calendario', 'historial']
    },
    directivo: {
        name: 'Directivo',
        permissions: {
            pasarLista: false,
            verInforme: true,
            calendario: true,
            historial: true,
            descargarInforme: true
        },
        navItems: ['ver informe', 'calendario', 'historial']
    },
    profesor: {
        name: 'Profesor',
        permissions: {
            pasarLista: true,
            verInforme: true,
            calendario: true,
            historial: false,
            editarCurso: true
        },
        navItems: ['pasar lista', 'ver informe', 'calendario']
    },
    alumno: {
        name: 'Alumno',
        permissions: {
            pasarLista: false,
            verInforme: true,
            calendario: true,
            historial: false
        },
        navItems: ['ver informe', 'calendario']
    },
    padre: {
        name: 'Padre (Invitado)',
        permissions: {
            pasarLista: false,
            verInforme: true,
            calendario: false,
            historial: false
        },
        navItems: ['ver informe']
    }
};

// Estado global de la aplicación
let currentRole = null;
let currentView = null;
let calendarMonth = new Date().getMonth();
let calendarYear = new Date().getFullYear();
let selectedDate = null;

// Datos de ejemplo (en una aplicación real, vendrían de una API)
let attendanceData = [];
let historyData = [];

// Almacén de datos de estudiantes por fecha para edición
let studentsByDate = {};

// Función para obtener clave de fecha
function getDateKey(date) {
    return date.toISOString().split('T')[0];
}

// Obtener la fecha de hoy y mostrarla
function updateDate() {
    const dateElement = document.getElementById('dateText');
    if (dateElement) {
        const today = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        dateElement.textContent = today.toLocaleDateString('es-ES', options);
    }
}

// Gestión de Roles
function selectRole(roleKey) {
    currentRole = roleKey;
    const role = roles[roleKey];
    
    if (!role) return;
    
    // Ocultar selector de rol y mostrar ventana principal
    document.getElementById('roleSelector').style.display = 'none';
    document.getElementById('mainWindow').style.display = 'flex';
    
    // Actualizar información del rol
    document.getElementById('currentRole').textContent = role.name;
    
    // Generar navegación según el rol
    generateNavigation(role);
    
    // Mostrar la primera vista disponible
    if (role.navItems.length > 0) {
        showView(role.navItems[0]);
    }
    
    // Configurar permisos de vistas
    configureViewPermissions(role);
}

function generateNavigation(role) {
    const leftPanel = document.getElementById('leftPanel');
    leftPanel.innerHTML = '';
    
    role.navItems.forEach((item, index) => {
        const btn = document.createElement('button');
        btn.className = 'nav-btn';
        if (index === 0) btn.classList.add('active');
        btn.textContent = item;
        btn.addEventListener('click', () => {
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            showView(item);
        });
        leftPanel.appendChild(btn);
    });
}

function configureViewPermissions(role) {
    // Configurar vista Pasar Lista
    const pasarListaView = document.getElementById('viewPasarLista');
    if (role.permissions.pasarLista) {
        // Mostrar/ocultar campos según rol
        const filterRowMateriaProfesor = document.getElementById('filterRowMateriaProfesor');
        if (role.permissions.editarCurso) {
            document.getElementById('btnEditarCurso').style.display = 'inline-block';
        }
        if (currentRole === 'preceptor') {
            filterRowMateriaProfesor.style.display = 'flex';
            document.getElementById('coursesCarouselContainer').style.display = 'flex';
            document.getElementById('attendanceList').style.display = 'none';
        } else if (currentRole === 'profesor') {
            filterRowMateriaProfesor.style.display = 'none';
            document.getElementById('coursesCarouselContainer').style.display = 'none';
        }
    }
    
    // Configurar vista Informe
    const informeRowMateriaProfesor = document.getElementById('informeRowMateriaProfesor');
    const informeProfesorGroup = document.getElementById('informeProfesorGroup');
    
    if (currentRole === 'alumno' || currentRole === 'padre') {
        informeProfesorGroup.style.display = 'none';
    } else {
        informeProfesorGroup.style.display = 'block';
        informeRowMateriaProfesor.style.display = 'flex';
    }
    
    if (role.permissions.descargarInforme) {
        document.getElementById('btnDescargarAlumno').style.display = 'inline-block';
        document.getElementById('btnDescargarCurso').style.display = 'inline-block';
    }
    
    // Configurar vista Calendario
    const calendarActions = document.getElementById('calendarActions');
    if (currentRole === 'preceptor' || currentRole === 'directivo' || currentRole === 'profesor') {
        if (currentRole === 'preceptor') {
            calendarActions.innerHTML = `
                <button class="action-btn" id="btnAccionCalendario">Realizar Acción</button>
                <button class="action-btn secondary" id="btnInformeDia">Informe del Día</button>
                <button class="action-btn secondary" id="btnAusenciasDia">Ausencias/Presencias</button>
            `;
        } else {
            calendarActions.innerHTML = `
                <button class="action-btn secondary" id="btnInformeDia">Informe del Día</button>
                <button class="action-btn secondary" id="btnAusenciasDia">Ausencias/Presencias</button>
            `;
        }
    } else if (currentRole === 'alumno') {
        calendarActions.innerHTML = `
            <button class="action-btn secondary" id="btnInformeDia">Informe del Día</button>
        `;
    }
}

// Gestión de Vistas
function showView(viewName) {
    // Ocultar todas las vistas
    document.querySelectorAll('.view-content').forEach(view => {
        view.style.display = 'none';
    });
    
    currentView = viewName;
    
    // Mostrar vista correspondiente
    const viewMap = {
        'pasar lista': 'viewPasarLista',
        'ver informe': 'viewInforme',
        'calendario': 'viewCalendario',
        'historial': 'viewHistorial'
    };
    
    const viewId = viewMap[viewName];
    if (viewId) {
        const view = document.getElementById(viewId);
        if (view) {
            view.style.display = 'flex';
            view.style.flexDirection = 'column';
            
            // Inicializar vista específica
            if (viewName === 'calendario') {
                initCalendar();
            } else if (viewName === 'pasar lista') {
                initPasarLista();
            } else if (viewName === 'ver informe') {
                initInforme();
            } else if (viewName === 'historial') {
                initHistorial();
            }
        }
    }
}

// Vista: Pasar Lista
function initPasarLista() {
    // Si es preceptor, mostrar grid de cursos
    if (currentRole === 'preceptor') {
        loadCoursesGrid();
    } else {
        // Para profesor, mostrar lista de estudiantes
        loadStudentsList();
    }
    
    // Establecer fecha por defecto
    const fechaInput = document.getElementById('filterFecha');
    if (fechaInput && !fechaInput.value) {
        fechaInput.value = new Date().toISOString().split('T')[0];
    }
    
    // Event listeners (solo agregar si no existen)
    const buscarBtn = document.getElementById('btnBuscar');
    if (buscarBtn) {
        buscarBtn.onclick = () => {
            if (currentRole === 'preceptor') {
                loadAttendanceList();
            } else {
                loadStudentsList();
            }
        };
    }
    
    const editarBtn = document.getElementById('btnEditarCurso');
    if (editarBtn) {
        editarBtn.onclick = () => {
            alert('Funcionalidad de editar curso');
        };
    }
}

let coursesCarouselIndex = 0;
let coursesPerView = 3;

function loadCoursesGrid() {
    const grid = document.getElementById('coursesGrid');
    grid.innerHTML = '';
    
    // Más cursos para que el carrusel tenga sentido
    const courses = [
        { name: '6°1', passed: true, materia: 'Matemática' },
        { name: '6°2', passed: false, materia: 'Lengua' },
        { name: '7°1', passed: true, materia: 'Ciencias' },
        { name: '7°2', passed: true, materia: 'Matemática' },
        { name: '5°1', passed: false, materia: 'Lengua' },
        { name: '4°2', passed: true, materia: 'Ciencias' },
        { name: '3°1', passed: true, materia: 'Matemática' },
        { name: '2°2', passed: false, materia: 'Lengua' }
    ];
    
    courses.forEach(course => {
        const card = document.createElement('div');
        card.className = `course-card ${course.passed ? 'passed' : 'not-passed'}`;
        card.innerHTML = `
            <h4>${course.name}</h4>
            <p>${course.materia}</p>
            <span class="course-status ${course.passed ? 'passed' : 'not-passed'}">
                ${course.passed ? 'Lista Pasada' : 'Sin Pasar'}
            </span>
        `;
        card.addEventListener('click', () => {
            document.getElementById('filterCurso').value = course.name;
            document.getElementById('attendanceList').style.display = 'block';
            document.getElementById('coursesCarouselContainer').style.display = 'none';
            loadAttendanceList();
        });
        grid.appendChild(card);
    });
    
    // Resetear índice del carrusel
    coursesCarouselIndex = 0;
    updateCoursesCarousel();
    setupCoursesCarousel();
}

function setupCoursesCarousel() {
    const leftArrow = document.getElementById('coursesCarouselLeft');
    const rightArrow = document.getElementById('coursesCarouselRight');
    const grid = document.getElementById('coursesGrid');
    
    if (!leftArrow || !rightArrow || !grid) return;
    
    // Remover listeners previos si existen
    leftArrow.onclick = null;
    rightArrow.onclick = null;
    
    leftArrow.onclick = () => {
        if (coursesCarouselIndex > 0) {
            coursesCarouselIndex--;
            updateCoursesCarousel();
        }
    };
    
    rightArrow.onclick = () => {
        const totalCourses = grid.children.length;
        const maxIndex = Math.max(0, totalCourses - coursesPerView);
        if (coursesCarouselIndex < maxIndex) {
            coursesCarouselIndex++;
            updateCoursesCarousel();
        }
    };
    
    // Actualizar estado inicial
    updateCoursesCarousel();
}

function updateCoursesCarousel() {
    const grid = document.getElementById('coursesGrid');
    const leftArrow = document.getElementById('coursesCarouselLeft');
    const rightArrow = document.getElementById('coursesCarouselRight');
    
    if (!grid || !leftArrow || !rightArrow || grid.children.length === 0) return;
    
    const totalCourses = grid.children.length;
    
    // Calcular el ancho de cada tarjeta (200px min-width + 20px gap)
    const cardWidth = 200;
    const gap = 20;
    const cardTotalWidth = cardWidth + gap;
    
    // Calcular la posición de desplazamiento
    const translateX = -coursesCarouselIndex * cardTotalWidth;
    grid.style.transform = `translateX(${translateX}px)`;
    
    // Actualizar estado de las flechas
    const maxIndex = Math.max(0, totalCourses - coursesPerView);
    
    // Flecha izquierda
    if (coursesCarouselIndex === 0) {
        leftArrow.disabled = true;
        leftArrow.style.opacity = '0.3';
        leftArrow.style.cursor = 'not-allowed';
        leftArrow.classList.add('disabled');
    } else {
        leftArrow.disabled = false;
        leftArrow.style.opacity = '1';
        leftArrow.style.cursor = 'pointer';
        leftArrow.classList.remove('disabled');
    }
    
    // Flecha derecha
    if (coursesCarouselIndex >= maxIndex || totalCourses <= coursesPerView) {
        rightArrow.disabled = true;
        rightArrow.style.opacity = '0.3';
        rightArrow.style.cursor = 'not-allowed';
        rightArrow.classList.add('disabled');
    } else {
        rightArrow.disabled = false;
        rightArrow.style.opacity = '1';
        rightArrow.style.cursor = 'pointer';
        rightArrow.classList.remove('disabled');
    }
}

function loadAttendanceList() {
    const list = document.getElementById('studentsList');
    const curso = document.getElementById('filterCurso').value;
    
    if (!curso) {
        alert('Seleccione un curso');
        return;
    }
    
    // Datos de ejemplo
    const students = [
        { id: 1, name: 'Juan Pérez', present: null },
        { id: 2, name: 'María García', present: null },
        { id: 3, name: 'Carlos López', present: null },
        { id: 4, name: 'Ana Martínez', present: null }
    ];
    
    list.innerHTML = '';
    students.forEach(student => {
        const item = document.createElement('div');
        item.className = 'student-item';
        item.innerHTML = `
            <span class="student-name">${student.name}</span>
            <div class="attendance-actions">
                <button class="attendance-btn present ${student.present === true ? 'active' : ''}" 
                        data-student-id="${student.id}" data-action="present">
                    Presente
                </button>
                <button class="attendance-btn absent ${student.present === false ? 'active' : ''}" 
                        data-student-id="${student.id}" data-action="absent">
                    Ausente
                </button>
            </div>
        `;
        
        // Event listeners para botones de asistencia
        item.querySelectorAll('.attendance-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const action = this.dataset.action;
                const studentId = this.dataset.studentId;
                
                // Actualizar botones
                item.querySelectorAll('.attendance-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                
                // Actualizar contadores
                updateAttendanceCounters();
                
                // Registrar en historial
                addToHistory({
                    action: `Marcó ${action === 'present' ? 'presente' : 'ausente'} a ${students.find(s => s.id == studentId).name}`,
                    date: new Date(),
                    curso: curso
                });
            });
        });
        
        list.appendChild(item);
    });
    
    document.getElementById('attendanceList').style.display = 'block';
    updateAttendanceCounters();
}

function loadStudentsList() {
    // Similar a loadAttendanceList pero para profesores
    loadAttendanceList();
}

function updateAttendanceCounters() {
    const present = document.querySelectorAll('.attendance-btn.present.active').length;
    const absent = document.querySelectorAll('.attendance-btn.absent.active').length;
    
    document.getElementById('countPresent').textContent = present;
    document.getElementById('countAbsent').textContent = absent;
}

// Vista: Informe
function initInforme() {
    document.getElementById('btnGenerarInforme')?.addEventListener('click', generateReport);
    document.getElementById('btnDescargarAlumno')?.addEventListener('click', () => downloadReport('alumno'));
    document.getElementById('btnDescargarCurso')?.addEventListener('click', () => downloadReport('curso'));
}

function generateReport() {
    const reportContent = document.getElementById('reportContent');
    const curso = document.getElementById('informeCurso').value;
    const alumno = document.getElementById('informeAlumno').value;
    const materia = document.getElementById('informeMateria').value;
    
    // Generar tabla de informe
    reportContent.innerHTML = `
        <h3>Informe de Asistencias</h3>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Fecha</th>
                    <th>Alumno</th>
                    <th>Curso</th>
                    ${currentRole !== 'alumno' && currentRole !== 'padre' ? '<th>Materia</th>' : ''}
                    ${currentRole !== 'alumno' && currentRole !== 'padre' ? '<th>Profesor</th>' : ''}
                    <th>Estado</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>${new Date().toLocaleDateString('es-ES')}</td>
                    <td>${alumno || 'Juan Pérez'}</td>
                    <td>${curso || '6°1'}</td>
                    ${currentRole !== 'alumno' && currentRole !== 'padre' ? '<td>' + (materia || 'Matemática') + '</td>' : ''}
                    ${currentRole !== 'alumno' && currentRole !== 'padre' ? '<td>Prof. García</td>' : ''}
                    <td>Presente</td>
                </tr>
            </tbody>
        </table>
    `;
}

function downloadReport(type) {
    const curso = document.getElementById('informeCurso')?.value || 'todos';
    const alumno = document.getElementById('informeAlumno')?.value || 'todos';
    const materia = document.getElementById('informeMateria')?.value || 'todas';
    
    // Obtener datos de asistencia del localStorage
    const attendanceData = JSON.parse(localStorage.getItem('attendanceData')) || {};
    
    // Filtrar datos según el tipo de reporte
    let filteredData = [];
    
    if (type === 'alumno' && alumno !== 'todos') {
        // Filtrar por alumno específico
        for (const date in attendanceData) {
            const dayData = attendanceData[date];
            const studentData = dayData[alumno];
            
            if (studentData && (curso === 'todos' || studentData.curso === curso) && 
                (materia === 'todas' || studentData.materia === materia)) {
                filteredData.push({
                    fecha: date,
                    nombre: studentData.nombre,
                    curso: studentData.curso,
                    materia: studentData.materia,
                    estado: studentData.presente ? 'Presente' : 'Ausente',
                    observaciones: studentData.observaciones || ''
                });
            }
        }
    } else if (type === 'curso' && curso !== 'todos') {
        // Filtrar por curso específico
        const studentsByCourse = {};
        
        // Agrupar por alumno y contar asistencias
        for (const date in attendanceData) {
            const dayData = attendanceData[date];
            
            for (const studentId in dayData) {
                const studentData = dayData[studentId];
                
                if (studentData.curso === curso && (materia === 'todas' || studentData.materia === materia)) {
                    if (!studentsByCourse[studentId]) {
                        studentsByCourse[studentId] = {
                            nombre: studentData.nombre,
                            total: 0,
                            presentes: 0,
                            ausentes: 0
                        };
                    }
                    
                    studentsByCourse[studentId].total++;
                    if (studentData.presente) {
                        studentsByCourse[studentId].presentes++;
                    } else {
                        studentsByCourse[studentId].ausentes++;
                    }
                }
            }
        }
        
        // Convertir a array para el reporte
        filteredData = Object.entries(studentsByCourse).map(([id, data]) => ({
            alumno: data.nombre,
            total_clases: data.total,
            asistencias: data.presentes,
            inasistencias: data.ausentes,
            porcentaje_asistencia: data.total > 0 ? Math.round((data.presentes / data.total) * 100) : 0
        }));
    }
    
    if (filteredData.length === 0) {
        alert('No hay datos para generar el reporte con los filtros seleccionados.');
        return;
    }
    
    // Crear archivo Excel
    let csvContent = '';
    
    if (type === 'alumno') {
        // Encabezados para reporte por alumno
        csvContent = 'Fecha,Nombre,Curso,Materia,Estado,Observaciones\n';
        
        // Agregar datos
        filteredData.forEach(item => {
            csvContent += `"${item.fecha}","${item.nombre}","${item.curso}","${item.materia}","${item.estado}","${item.observaciones}"\n`;
        });
        
        // Crear y descargar archivo
        downloadCSV(csvContent, `asistencia_${alumno}_${new Date().toISOString().split('T')[0]}.csv`);
    } else if (type === 'curso') {
        // Encabezados para reporte por curso
        csvContent = 'Alumno,Total Clases,Asistencias,Inasistencias,% Asistencia\n';
        
        // Agregar datos
        filteredData.forEach(item => {
            csvContent += `"${item.alumno}",${item.total_clases},${item.asistencias},${item.inasistencias},${item.porcentaje_asistencia}%\n`;
        });
        
        // Crear y descargar archivo
        downloadCSV(csvContent, `asistencia_${curso}_${new Date().toISOString().split('T')[0]}.csv`);
    }
}

function downloadCSV(csvContent, fileName) {
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    
    // Limpiar
    setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }, 100);
}

// Vista: Calendario
function initCalendar() {
    renderCalendar();
    
    document.getElementById('prevMonth')?.addEventListener('click', () => {
        calendarMonth--;
        if (calendarMonth < 0) {
            calendarMonth = 11;
            calendarYear--;
        }
        renderCalendar();
    });
    
    document.getElementById('nextMonth')?.addEventListener('click', () => {
        calendarMonth++;
        if (calendarMonth > 11) {
            calendarMonth = 0;
            calendarYear++;
        }
        renderCalendar();
    });
}

function renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    const monthTitle = document.getElementById('currentMonth');
    
    if (!grid || !monthTitle) return;
    
    const date = new Date(calendarYear, calendarMonth, 1);
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                       'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    monthTitle.textContent = `${monthNames[calendarMonth]} ${calendarYear}`;
    
    // Días de la semana
    const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    grid.innerHTML = '';
    
    weekDays.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-day-header';
        header.textContent = day;
        grid.appendChild(header);
    });
    
    // Primer día del mes
    const firstDay = date.getDay();
    
    // Días del mes anterior
    const prevMonth = new Date(calendarYear, calendarMonth, 0);
    const daysInPrevMonth = prevMonth.getDate();
    
    for (let i = firstDay - 1; i >= 0; i--) {
        const day = document.createElement('div');
        day.className = 'calendar-day other-month';
        day.textContent = daysInPrevMonth - i;
        grid.appendChild(day);
    }
    
    // Días del mes actual
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const today = new Date();
    
    for (let i = 1; i <= daysInMonth; i++) {
        const day = document.createElement('div');
        day.className = 'calendar-day';
        
        if (today.getDate() === i && today.getMonth() === calendarMonth && today.getFullYear() === calendarYear) {
            day.classList.add('today');
        }
        
        if (selectedDate && selectedDate.getDate() === i && selectedDate.getMonth() === calendarMonth && selectedDate.getFullYear() === calendarYear) {
            day.classList.add('selected');
        }
        
        day.textContent = i;
        day.addEventListener('click', () => {
            selectedDate = new Date(calendarYear, calendarMonth, i);
            renderCalendar();
            showCalendarDetails(selectedDate);
        });
        
        grid.appendChild(day);
    }
    
    // Completar semana
    const lastDay = new Date(calendarYear, calendarMonth, daysInMonth).getDay();
    for (let i = 1; i <= 6 - lastDay; i++) {
        const day = document.createElement('div');
        day.className = 'calendar-day other-month';
        day.textContent = i;
        grid.appendChild(day);
    }
}

function showCalendarDetails(date) {
    const details = document.getElementById('calendarDetails');
    const title = document.getElementById('selectedDateTitle');
    
    if (!details || !title) return;
    
    details.style.display = 'block';
    title.textContent = `Fecha seleccionada: ${date.toLocaleDateString('es-ES', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    })}`;
    
    // Configurar acciones según rol
    setupCalendarActions(date);
    
    // Mostrar información del día
    loadDayInfo(date);
}

function setupCalendarActions(date) {
    // Los botones ya se configuraron en configureViewPermissions
    document.getElementById('btnInformeDia')?.addEventListener('click', () => {
        showDayReport(date);
    });
    
    document.getElementById('btnAusenciasDia')?.addEventListener('click', () => {
        showDayAttendance(date);
    });
    
    document.getElementById('btnAccionCalendario')?.addEventListener('click', () => {
        performCalendarAction(date);
    });
}

function showDayReport(date) {
    const dayInfo = document.getElementById('dayInfo');
    dayInfo.innerHTML = `
        <h4>Informe del Día</h4>
        <div class="day-summary">
            <div class="summary-card">
                <h4>Total Presentes</h4>
                <div class="value">25</div>
            </div>
            <div class="summary-card">
                <h4>Total Ausentes</h4>
                <div class="value">5</div>
            </div>
            <div class="summary-card">
                <h4>Cursos</h4>
                <div class="value">8</div>
            </div>
        </div>
    `;
}

function showDayAttendance(date) {
    const dayInfo = document.getElementById('dayInfo');
    const curso = document.getElementById('calendarCurso').value;
    
    if (!curso) {
        alert('Seleccione un curso');
        return;
    }
    
    dayInfo.innerHTML = `
        <h4>Ausencias/Presencias - ${curso}</h4>
        <div class="day-summary">
            <div class="summary-card">
                <h4>Presentes</h4>
                <div class="value">20</div>
            </div>
            <div class="summary-card">
                <h4>Ausentes</h4>
                <div class="value">4</div>
            </div>
        </div>
    `;
}

function performCalendarAction(date) {
    const curso = document.getElementById('calendarCurso').value;
    if (!curso) {
        alert('Seleccione un curso para realizar la acción');
        return;
    }
    alert(`Realizando acción para el curso ${curso} el día ${date.toLocaleDateString('es-ES')}`);
}

function loadDayInfo(date) {
    // Cargar información del día seleccionado - mostrar lista de estudiantes automáticamente
    showDayAttendanceList(date);
}

function showDayAttendanceList(date) {
    const dayInfo = document.getElementById('dayInfo');
    const cursoSelect = document.getElementById('calendarCurso');
    
    // Formatear fecha para mostrar
    const dateStr = date.toLocaleDateString('es-ES', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    const dateKey = getDateKey(date);
    
    // Datos de ejemplo de estudiantes (en una app real vendrían de una API)
    // Si ya existen datos editados para esta fecha, usarlos; si no, usar los iniciales
    if (!studentsByDate[dateKey]) {
        studentsByDate[dateKey] = [
            { id: 1, name: 'Juan Pérez', curso: '6°1', present: true },
            { id: 2, name: 'María García', curso: '6°1', present: true },
            { id: 3, name: 'Carlos López', curso: '6°1', present: false },
            { id: 4, name: 'Ana Martínez', curso: '6°1', present: true },
            { id: 5, name: 'Pedro Sánchez', curso: '6°2', present: true },
            { id: 6, name: 'Laura Fernández', curso: '6°2', present: false },
            { id: 7, name: 'Miguel Torres', curso: '6°2', present: true },
            { id: 8, name: 'Sofía Ruiz', curso: '7°1', present: true },
            { id: 9, name: 'Diego Morales', curso: '7°1', present: false },
            { id: 10, name: 'Elena Vargas', curso: '7°1', present: true }
        ];
    }
    
    const allStudents = studentsByDate[dateKey];
    
    // Filtrar por curso si está seleccionado
    const selectedCurso = cursoSelect ? cursoSelect.value : '';
    let filteredStudents = [...allStudents];
    
    if (selectedCurso) {
        filteredStudents = allStudents.filter(s => s.curso === selectedCurso);
    }
    
    // Separar presentes y ausentes
    const presentes = filteredStudents.filter(s => s.present);
    const ausentes = filteredStudents.filter(s => !s.present);
    
    // Verificar si el rol tiene permisos para editar
    const canEdit = currentRole === 'preceptor' || currentRole === 'admin';
    
    // Crear HTML
    let html = `
        <div class="day-attendance-header">
            <h4>Registro de Asistencia - ${dateStr}</h4>
            <div class="attendance-stats">
                <span class="stat-present">Presentes: <strong>${presentes.length}</strong></span>
                <span class="stat-absent">Ausentes: <strong>${ausentes.length}</strong></span>
            </div>
        </div>
    `;
    
    if (selectedCurso) {
        html += `<p class="course-filter-info">Filtrado por: <strong>${selectedCurso}</strong></p>`;
    }
    
    html += `
        <div class="attendance-list-by-day">
            <div class="present-students-section">
                <h5 class="section-title present-title">
                    <i class="fas fa-check-circle"></i> Presentes (${presentes.length})
                </h5>
                <div class="students-day-list">
    `;
    
    if (presentes.length > 0) {
        presentes.forEach(student => {
            html += `
                <div class="student-day-item present" data-student-id="${student.id}">
                    <i class="fas fa-check-circle"></i>
                    <span class="student-name">${student.name}</span>
                    <span class="student-course">${student.curso}</span>
                    ${canEdit ? `
                        <button class="edit-attendance-btn" onclick="toggleAttendance(${student.id}, '${dateKey}')" title="Cambiar a Ausente">
                            <i class="fas fa-edit"></i>
                        </button>
                    ` : ''}
                </div>
            `;
        });
    } else {
        html += `<p class="no-students">No hay estudiantes presentes</p>`;
    }
    
    html += `
                </div>
            </div>
            
            <div class="absent-students-section">
                <h5 class="section-title absent-title">
                    <i class="fas fa-times-circle"></i> Ausentes (${ausentes.length})
                </h5>
                <div class="students-day-list">
    `;
    
    if (ausentes.length > 0) {
        ausentes.forEach(student => {
            html += `
                <div class="student-day-item absent" data-student-id="${student.id}">
                    <i class="fas fa-times-circle"></i>
                    <span class="student-name">${student.name}</span>
                    <span class="student-course">${student.curso}</span>
                    ${canEdit ? `
                        <button class="edit-attendance-btn" onclick="toggleAttendance(${student.id}, '${dateKey}')" title="Cambiar a Presente">
                            <i class="fas fa-edit"></i>
                        </button>
                    ` : ''}
                </div>
            `;
        });
    } else {
        html += `<p class="no-students">No hay estudiantes ausentes</p>`;
    }
    
    html += `
                </div>
            </div>
        </div>
    `;
    
    dayInfo.innerHTML = html;
    
    // Agregar listener al select de curso para actualizar la lista
    if (cursoSelect) {
        // Remover listeners previos para evitar duplicados
        cursoSelect.onchange = null;
        cursoSelect.addEventListener('change', () => {
            showDayAttendanceList(date);
        });
    }
}

// Función para cambiar el estado de asistencia de un estudiante
function toggleAttendance(studentId, dateKey) {
    if (!studentsByDate[dateKey]) return;
    
    const student = studentsByDate[dateKey].find(s => s.id === studentId);
    if (!student) return;
    
    // Cambiar el estado
    const oldState = student.present ? 'presente' : 'ausente';
    student.present = !student.present;
    const newState = student.present ? 'presente' : 'ausente';
    
    // Registrar en historial
    addToHistory({
        action: `Cambió asistencia de ${student.name} de ${oldState} a ${newState}`,
        date: new Date(),
        curso: student.curso,
        studentId: studentId,
        dateKey: dateKey
    });
    
    // Recargar la vista si hay una fecha seleccionada
    if (selectedDate) {
        showDayAttendanceList(selectedDate);
    }
}

// Vista: Historial
function initHistorial() {
    document.getElementById('btnBuscarHistorial')?.addEventListener('click', loadHistory);
    loadHistory();
}

function loadHistory() {
    const historyContent = document.getElementById('historyContent');
    
    // Datos de ejemplo
    const history = [
        {
            date: new Date(),
            user: 'Preceptor García',
            action: 'Cambió asistencia de alumno Juan Pérez',
            details: 'Curso: 6°1, Fecha: ' + new Date().toLocaleDateString('es-ES')
        },
        {
            date: new Date(Date.now() - 86400000),
            user: 'Preceptor García',
            action: 'Pasó lista en curso 6°2',
            details: 'Materia: Matemática, Profesor: Prof. López'
        }
    ];
    
    historyContent.innerHTML = '';
    
    history.forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
            <div class="history-header">
                <span class="history-date">${item.date.toLocaleDateString('es-ES', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })}</span>
                <span class="history-user">${item.user}</span>
            </div>
            <div class="history-action">${item.action}</div>
            <div class="history-details">${item.details}</div>
        `;
        historyContent.appendChild(historyItem);
    });
}

function addToHistory(item) {
    historyData.push(item);
    if (currentView === 'historial') {
        loadHistory();
    }
}

// Funcionalidad del botón de cerrar
function setupCloseButton() {
    const closeBtn = document.getElementById('closeBtn');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            if (confirm('¿Desea cerrar la aplicación?')) {
                document.getElementById('mainWindow').style.display = 'none';
                document.getElementById('roleSelector').style.display = 'flex';
                currentRole = null;
            }
        });
    }
}

// Cambiar rol
function setupChangeRoleButton() {
    const changeRoleBtn = document.getElementById('changeRoleBtn');
    if (changeRoleBtn) {
        changeRoleBtn.addEventListener('click', function() {
            document.getElementById('mainWindow').style.display = 'none';
            document.getElementById('roleSelector').style.display = 'flex';
        });
    }
}

// Gestión de tema (modo oscuro/claro)
function initTheme() {
    // Obtener tema guardado o usar el predeterminado
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    
    // Configurar botón de toggle
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const themeIcon = document.getElementById('themeIcon');
    
    if (themeToggleBtn && themeIcon) {
        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            setTheme(newTheme);
        });
    }
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    // Actualizar ícono
    const themeIcon = document.getElementById('themeIcon');
    if (themeIcon) {
        if (theme === 'dark') {
            themeIcon.className = 'fas fa-sun';
        } else {
            themeIcon.className = 'fas fa-moon';
        }
    }
}

// Función para inicializar datos de prueba
function initTestData() {
    if (!localStorage.getItem('attendanceData')) {
        const today = new Date();
        const dateKey = getDateKey(today);
        
        const testData = {
            [dateKey]: {
                'alumno1': {
                    nombre: 'Juan Pérez',
                    curso: '6°1',
                    materia: 'Matemática',
                    presente: true,
                    observaciones: ''
                },
                'alumno2': {
                    nombre: 'María García',
                    curso: '6°1',
                    materia: 'Matemática',
                    presente: false,
                    observaciones: 'Justificada'
                },
                'alumno3': {
                    nombre: 'Carlos López',
                    curso: '6°2',
                    materia: 'Lengua',
                    presente: true,
                    observaciones: ''
                }
            }
        };
        
        localStorage.setItem('attendanceData', JSON.stringify(testData));
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    initTestData();
    updateDate();
    setupCloseButton();
    setupChangeRoleButton();
    initTheme();
    
    // Configurar botones de rol
    document.querySelectorAll('.role-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            selectRole(this.dataset.role);
        });
    });
    
    // Establecer fecha por defecto en campos de fecha
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('filterFecha')?.setAttribute('value', today);
    document.getElementById('informeFechaDesde')?.setAttribute('value', today);
    document.getElementById('informeFechaHasta')?.setAttribute('value', today);
    document.getElementById('historialFechaDesde')?.setAttribute('value', today);
    document.getElementById('historialFechaHasta')?.setAttribute('value', today);
    
    // Listener para redimensionar ventana y actualizar carrusel
    window.addEventListener('resize', () => {
        if (currentView === 'pasar lista' && currentRole === 'preceptor') {
            updateCoursesCarousel();
        }
    });
    
    console.log('Sistema de Gestión de Asistencias inicializado');
});

