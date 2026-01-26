import { Routes } from '@angular/router';

export const routes: Routes = [
  // ===== TIENDA (CLIENTE) - RUTA PRINCIPAL =====
  {
    path: '',
    loadComponent: () =>
      import('./tienda/diseno-tienda/layout-tienda/layout-tienda').then((m) => m.LayoutTienda),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./tienda/funcionalidades/inicio/inicio-pagina/inicio-pagina').then((m) => m.InicioPagina),
      },
      {
        path: 'categoria/:slug',
        loadComponent: () =>
          import('./tienda/funcionalidades/categoria/categoria-pagina/categoria-pagina').then((m) => m.CategoriaPagina),
      },
      {
        path: 'producto/:slug',
        loadComponent: () =>
          import('./tienda/funcionalidades/producto-detalle/producto-detalle-pagina/producto-detalle-pagina').then((m) => m.ProductoDetallePagina),
      },
      {
        path: 'perfil',
        loadComponent: () =>
          import('./tienda/funcionalidades/perfil/perfil-pagina/perfil-pagina').then((m) => m.PerfilPagina),
      },
    ],
  },
  // ===== CHECKOUT (SIN HEADER/FOOTER) =====
  {
    path: 'checkout',
    loadComponent: () =>
      import('./tienda/funcionalidades/checkout/checkout-pagina/checkout-pagina').then((m) => m.CheckoutPagina),
  },
  // ===== ADMIN =====
  {
    path: 'admin',
    loadComponent: () =>
      import('./admin/diseno-admin/layout-admin/layout-admin').then((m) => m.LayoutAdmin),
    children: [
      {
        path: '',
        redirectTo: 'inicio',
        pathMatch: 'full',
      },
      // ===== PÁGINA INICIO =====
      {
        path: 'inicio',
        loadComponent: () =>
          import(
            './admin/funcionalidades/panel-principal/panel-principal-pagina/panel-principal-pagina'
          ).then((m) => m.PanelPrincipalPagina),
      },
      // ===== CATÁLOGO - PRODUCTOS =====
      {
        path: 'catalogo/productos',
        loadComponent: () =>
          import(
            './admin/funcionalidades/catalogo-admin/productos-admin/productos-admin-pagina/productos-admin-pagina'
          ).then((m) => m.ProductosAdminPagina),
      },
      {
        path: 'catalogo/productos/nuevo',
        loadComponent: () =>
          import(
            './admin/funcionalidades/catalogo-admin/productos-admin/paginas/producto-formulario-pagina/producto-formulario-pagina'
          ).then((m) => m.ProductoFormularioPagina),
      },
      {
        path: 'catalogo/productos/editar/:id',
        loadComponent: () =>
          import(
            './admin/funcionalidades/catalogo-admin/productos-admin/paginas/producto-formulario-pagina/producto-formulario-pagina'
          ).then((m) => m.ProductoFormularioPagina),
      },
      // ===== CATÁLOGO - CATEGORÍAS =====
      {
        path: 'catalogo/categorias',
        loadComponent: () =>
          import(
            './admin/funcionalidades/catalogo-admin/categorias-admin/categorias-admin-pagina/categorias-admin-pagina'
          ).then((m) => m.CategoriasAdminPagina),
      },
      // ===== CATÁLOGO - CODIGOS =====
      {
        path: 'catalogo/codigos',
        loadComponent: () =>
          import(
            './admin/funcionalidades/catalogo-admin/codigos-admin/codigos-admin-pagina/codigos-admin-pagina'
          ).then((m) => m.CodigosAdminPagina),
      },
      // ===== CATÁLOGO - BILLETERA =====
      {
        path: 'catalogo/billetera',
        loadComponent: () =>
          import(
            './admin/funcionalidades/catalogo-admin/billetera-admin/billetera-admin-pagina/billetera-admin-pagina'
          ).then((m) => m.BilleteraAdminPagina),
      },
      // ===== PEDIDOS =====
      {
        path: 'pedidos',
        loadComponent: () =>
          import(
            './admin/funcionalidades/pedidos-admin/pedidos-admin-pagina/pedidos-admin-pagina'
          ).then((m) => m.PedidosAdminPagina),
      },
      // ===== USUARIOS =====
      {
        path: 'usuarios',
        loadComponent: () =>
          import(
            './admin/funcionalidades/usuarios-admin/usuarios-admin-pagina/usuarios-admin-pagina'
          ).then((m) => m.UsuariosAdminPagina),
      },
      // ===== MARKETING =====
      {
        path: 'marketing/encabezado',
        loadComponent: () =>
          import(
            './admin/funcionalidades/marketing-admin/encabezado-admin/encabezado-admin-pagina/encabezado-admin-pagina'
          ).then((m) => m.EncabezadoAdminPagina),
      },
      {
        path: 'marketing/promocion',
        loadComponent: () =>
          import(
            './admin/funcionalidades/marketing-admin/promocion-admin/promocion-admin-pagina/promocion-admin-pagina'
          ).then((m) => m.PromocionAdminPagina),
      },
      {
        path: 'marketing/carrusel',
        loadComponent: () =>
          import(
            './admin/funcionalidades/marketing-admin/carrusel-admin/carrusel-admin-pagina/carrusel-admin-pagina'
          ).then((m) => m.CarruselAdminPagina),
      },
      {
        path: 'marketing/categorias',
        loadComponent: () =>
          import(
            './admin/funcionalidades/marketing-admin/categorias-marketing-admin/categorias-marketing-admin-pagina/categorias-marketing-admin-pagina'
          ).then((m) => m.CategoriasMarketingAdminPagina),
      },
      {
        path: 'marketing/pie-de-pagina',
        loadComponent: () =>
          import(
            './admin/funcionalidades/marketing-admin/pie-de-pagina-admin/pie-de-pagina-admin-pagina/pie-de-pagina-admin-pagina'
          ).then((m) => m.PieDePaginaAdminPagina),
      },
      // ===== MÉTRICAS =====
      {
        path: 'metricas',
        loadComponent: () =>
          import(
            './admin/funcionalidades/metricas-admin/metricas-admin-pagina/metricas-admin-pagina'
          ).then((m) => m.MetricasAdminPagina),
      },
      // ===== CONFIGURACIONES =====
      {
        path: 'configuraciones/metodos-pago',
        loadComponent: () =>
          import(
            './admin/funcionalidades/configuraciones-admin/metodos-pago-admin/metodos-pago-admin-pagina/metodos-pago-admin-pagina'
          ).then((m) => m.MetodosPagoAdminPaginaComponente),
      },
    ],
  },
];
