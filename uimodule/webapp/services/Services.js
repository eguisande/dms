sap.ui.define([], function () {
  "use strict";
  return {
    _urlCatalog: null,
    _urlDMS: null,
    _urlWF: null,
    _urlUserApi: null,
    _urlPdfApi: null,    

    callGetService: function (sEntity) {
      return new Promise((res, rej) => {
        fetch(`${this._urlCatalog}/${sEntity}`)
          .then((response) => response.json())
          .then((oData) => (oData.error ? rej(oData.error) : res(oData)))
          .catch((err) => rej(err));
      });
    },

    callPostService: function (sEntity, oPayload) {
      return new Promise((res, rej) => {
        fetch(`${this._urlCatalog}/${sEntity}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(oPayload),
        })
          .then((response) => response.json())
          .then((oData) => (oData.error ? rej(oData.error) : res(oData)))
          .catch((err) => rej(err));
      });
    },

    callUpdateService: function (sEntity, oPayload) {
      return new Promise((res, rej) => {
        fetch(`${this._urlCatalog}/${sEntity}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(oPayload),
        })
          .then((response) => response.json())
          .then((oData) => (oData.error ? rej(oData.error) : res(oData)))
          .catch((err) => rej(err));
      });
    },

    callDeleteService: function (sEntity) {
      return new Promise((res, rej) => {
        fetch(`${this._urlCatalog}/${sEntity}`, {
          method: "DELETE",
        })
          .then((response) => res(response))
          .catch((err) => rej(err));
      });
    },

    setUrl: function (urlCatalog, urlDMS, urlWF, urlUserApi, urlPdfApi) {
      this._urlCatalog = urlCatalog;
      this._urlDMS = urlDMS;
      this._urlWF = urlWF;
      this._urlUserApi = urlUserApi;
      this._urlPdfApi = urlPdfApi;
    },

    getObras: function () {
      return this.callGetService(
        "Obras?$expand=estado,responsables($expand=inspectores($expand=inspector),gerencia,direccion),financiamiento_obra,ordenes_compra,contratista($expand=contratista),p3($expand=pi($expand=tipo_pi,p3,sistema_contratacion,responsables($expand=responsables($expand=direccion,gerencia,inspectores($expand=inspector)))),importes($expand=p3),fluido,tipo_obra,tipo_contrato,sistema,partido)&$orderby=nombre"
      );
    },

    getObrasJefeInspector: function (usuario, tipo_inspector) {
      return this.callGetService(
        `getObrasByInspector(usuario='${usuario}',tipo_inspector='${tipo_inspector}')?$expand=estado,responsables($expand=inspectores($expand=inspector),gerencia,direccion),financiamiento_obra,ordenes_compra,contratista($expand=contratista),p3($expand=pi($expand=tipo_pi,p3,sistema_contratacion,responsables($expand=responsables($expand=direccion,gerencia,inspectores($expand=inspector)))),importes($expand=p3),fluido,tipo_obra,tipo_contrato,sistema,partido)&$orderby=nombre`
      );
    },

    getObra: function (ID) {
      return this.callGetService(
        `Obras/${ID}?$expand=estado,responsables($expand=inspectores($expand=inspector),gerencia,direccion),financiamiento_obra,ordenes_compra,contratista($expand=contratista),p3($expand=pi($expand=tipo_pi,p3,sistema_contratacion,responsables($expand=responsables($expand=direccion,gerencia,inspectores($expand=inspector)))),importes($expand=p3),fluido,tipo_obra,tipo_contrato,sistema,partido)`
      );
    },

    deleteObra: function (ID) {
      return this.callDeleteService(`Obras/${ID}`);
    },

    getContratistas: function () {
      return this.callGetService("Contratistas");
    },

    getResponsablesPI: function (respID) {
      return this.callGetService(`ResponsablesPI?$filter=responsables_ID eq ${respID}`);
    },

    getResponsables: function () {
      return this.callGetService("Responsables");
    },

    getDirecciones: function () {
      return this.callGetService("Direcciones");
    },

    getInspectores: function () {
      return this.callGetService("Inspectores?$expand=tipo_inspector&$orderby=nombre");
    },

    getGerencias: function () {
      return this.callGetService("Gerencias");
    },

    getTiposContratos: function () {
      return this.callGetService("TiposContratos");
    },

    getTiposPI: function () {
      return this.callGetService("TiposPI");
    },

    getFluidos: function () {
      return this.callGetService("Fluidos");
    },

    getAreas: function () {
      return this.callGetService("Areas");
    },

    getPartidos: function () {
      return this.callGetService("Partidos");
    },

    getSistemas: function () {
      return this.callGetService("Sistemas");
    },

    getTiposObras: function () {
      return this.callGetService("TiposObras");
    },

    getMonedas: function () {
      return this.callGetService("Monedas");
    },

    getUnidadesMedida: function () {
      return this.callGetService("UMGeneral");
    },

    getSistemasContratacion: function () {
      return this.callGetService("SistemasContratacion");
    },

    getFinanciamientos: function () {
      return this.callGetService("Financiamientos");
    },

    getUUID: function () {
      return this.callGetService("getUUID()");
    },

    postObra: function (oPayload) {
      return this.callPostService("Obras", oPayload);
    },

    updateObra: function (ID, oPayload) {
      return this.callUpdateService(`Obras/${ID}`, oPayload);
    },  
    
    postResponsables: function (oPayload) {
      return this.callPostService("Responsables", oPayload);
    },

    postResponsablesPI: function (oPayload) {
      return this.callPostService("ResponsablesPI", oPayload);
    },

    deleteResponsables: function (ID) {
      return this.callDeleteService(`Responsables/${ID}`);
    },

    deleteResponsablesPI: function (ID) {
      return this.callDeleteService(`ResponsablesPI/${ID}`);
    },

    updateResponsablesPI: function (ID, oPayload) {
      return this.callUpdateService(`ResponsablesPI/${ID}`, oPayload);
    },

    getUser: async function () {
      try {
        if (window.location.hostname === "localhost") {
          return {
            user_uuid: ["64ff52e3-7bef-4706-be6f-645d504d12a0"],
            value: [
              "CAI_Developer",
              "HAA_USER",
              "IDE_Developer",
              "IRPAProjectMember",
              "Launchpad_Admin",
              "Launchpad_Advanced_Theming",
              "PGO_Administrador",
              "PGO_Analista",
              "PGO_Contratista",
              "PGO_Inspector",
              "PGO_JefeInspeccion",
              "PGO_Launchpad_Admin",
              "PGO_Launchpad_Advanced_Theming",
              "PGO_Super",
              "PGO_WorkflowManagementAdmin",
              "PGO_WorkflowManagementBusinessExpert",
              "PGO_WorkflowManagementDeveloper",
              "PGO_WorkflowManagementEndUser",
              "WorkflowManagementAdmin",
              "WorkflowManagementBusinessExpert",
              "WorkflowManagementDeveloper",
              "WorkflowManagementEndUser",
            ],
          };
        }
        const url = `${this._urlUserApi}/attributes`;
        const resp = await fetch(url);
        const user = await resp.json();
        return user;
      } catch (error) {
        console.log(error);
      }
    },

    getUserRoles: function () {
      if (window.location.hostname === "localhost") {
        return {
          user_uuid: ["64ff52e3-7bef-4706-be6f-645d504d12a0"],
          value: [
            //"PGO_AreaSeguridadHigiene"
            // "CAI_Developer",
            // "HAA_USER",
            // "IDE_Developer",
            // "IRPAProjectMember",
            // "Launchpad_Admin",
            // "Launchpad_Advanced_Theming",
            // "PGO_Administrador",
            // "PGO_Analista",
            // "PGO_Contratista",
            // "PGO_Inspector",
            // "PGO_JefeInspeccion",
            // "PGO_Launchpad_Admin",
            // "PGO_Launchpad_Advanced_Theming",
             "PGO_Super",
            // "PGO_WorkflowManagementAdmin",
            // "PGO_WorkflowManagementBusinessExpert",
            // "PGO_WorkflowManagementDeveloper",
            // "PGO_WorkflowManagementEndUser",
            // "WorkflowManagementAdmin",
            // "WorkflowManagementBusinessExpert",
            // "WorkflowManagementDeveloper",
            // "WorkflowManagementEndUser",
          ],
        };
      }
      return this.callGetService("getUserRoles()");
    },

    createFolderDMS: async function (proveedor, idObra, p3, pi, aAreas = []) {
      const url = `${this._urlDMS}/Obras`;
      const respFolderPrincipal = await fetch(url, {
        method: "POST",
        body: this.getFormDMS(`${idObra}_${proveedor}`),
      });
      const respFolderP3 = await fetch(`${url}/${idObra}_${proveedor}`, {
        method: "POST",
        body: this.getFormDMS(`${p3}`),
      });
      const respFolderPI = await fetch(`${url}/${idObra}_${proveedor}/${p3}`, {
        method: "POST",
        body: this.getFormDMS(`${pi}`),
      });
      const [
        respFolderOferta,
        respFolderCargaInicial,
        respFolderNotasPedido,
        respFolderOrdenesServicio,
        respFolderIngenieria,
        respFolderPermisos,
        respFolderSegHigiene,
        respFolderPolizas,
        respFolderInterferencias,
      ] = await Promise.all([
        fetch(`${url}/${idObra}_${proveedor}/${p3}/${pi}`, {
          method: "POST",
          body: this.getFormDMS(`Oferta`),
        }),
        fetch(`${url}/${idObra}_${proveedor}/${p3}/${pi}`, {
          method: "POST",
          body: this.getFormDMS(`Carga inicial`),
        }),
        fetch(`${url}/${idObra}_${proveedor}/${p3}/${pi}`, {
          method: "POST",
          body: this.getFormDMS(`Notas de pedido`),
        }),
        fetch(`${url}/${idObra}_${proveedor}/${p3}/${pi}`, {
          method: "POST",
          body: this.getFormDMS(`Órdenes de servicio`),
        }),
        fetch(`${url}/${idObra}_${proveedor}/${p3}/${pi}`, {
          method: "POST",
          body: this.getFormDMS(`Ingeniería`),
        }),
        fetch(`${url}/${idObra}_${proveedor}/${p3}/${pi}`, {
          method: "POST",
          body: this.getFormDMS(`Permisos`),
        }),
        fetch(`${url}/${idObra}_${proveedor}/${p3}/${pi}`, {
          method: "POST",
          body: this.getFormDMS(`Seguridad e Higiene`),
        }),
        fetch(`${url}/${idObra}_${proveedor}/${p3}/${pi}`, {
          method: "POST",
          body: this.getFormDMS(`Pólizas`),
        }),
        fetch(`${url}/${idObra}_${proveedor}/${p3}/${pi}`, {
          method: "POST",
          body: this.getFormDMS(`Interferencias`),
        }),
      ]);
      const aAreasPromise = await Promise.all(
        aAreas.map((item) => {
          return fetch(`${url}/${idObra}_${proveedor}/${p3}/${pi}/Carga inicial`, {
            method: "POST",
            body: this.getFormDMS(`${item.descripcion}`),
          });
        })
      );
      return await Promise.all([
        respFolderPrincipal.json(),
        respFolderP3.json(),
        respFolderPI.json(),
        respFolderOferta.json(),
        respFolderCargaInicial.json(),
        respFolderNotasPedido.json(),
        respFolderOrdenesServicio.json(),
        respFolderIngenieria.json(),
        respFolderPermisos.json(),
        respFolderSegHigiene.json(),
        respFolderPolizas.json(),
        respFolderInterferencias.json(),
        ...aAreasPromise.map((item) => item.json()),
      ]);
    },

    createFolderDMSUnificado: async function (proveedor, idObra, aAreas = []) {
      const url = `${this._urlDMS}/Obras`;
      const respFolderPrincipal = await fetch(url, {
        method: "POST",
        body: this.getFormDMS(`${idObra}_${proveedor}`),
      });
      const respFolderUnificado = await fetch(`${url}/${idObra}_${proveedor}`, {
        method: "POST",
        body: this.getFormDMS(`Unificado`),
      });
      const [
        respFolderOferta,
        respFolderCargaInicial,
        respFolderNotasPedido,
        respFolderOrdenesServicio,
        respFolderIngenieria,
        respFolderPermisos,
        respFolderSegHigiene,
        respFolderPolizas,
        respFolderInterferencias,
      ] = await Promise.all([
        fetch(`${url}/${idObra}_${proveedor}/Unificado`, {
          method: "POST",
          body: this.getFormDMS(`Oferta`),
        }),
        fetch(`${url}/${idObra}_${proveedor}/Unificado`, {
          method: "POST",
          body: this.getFormDMS(`Carga inicial`),
        }),
        fetch(`${url}/${idObra}_${proveedor}/Unificado`, {
          method: "POST",
          body: this.getFormDMS(`Notas de pedido`),
        }),
        fetch(`${url}/${idObra}_${proveedor}/Unificado`, {
          method: "POST",
          body: this.getFormDMS(`Órdenes de servicio`),
        }),
        fetch(`${url}/${idObra}_${proveedor}/Unificado`, {
          method: "POST",
          body: this.getFormDMS(`Ingeniería`),
        }),
        fetch(`${url}/${idObra}_${proveedor}/Unificado`, {
          method: "POST",
          body: this.getFormDMS(`Permisos`),
        }),
        fetch(`${url}/${idObra}_${proveedor}/Unificado`, {
          method: "POST",
          body: this.getFormDMS(`Seguridad e Higiene`),
        }),
        fetch(`${url}/${idObra}_${proveedor}/Unificado`, {
          method: "POST",
          body: this.getFormDMS(`Pólizas`),
        }),
        fetch(`${url}/${idObra}_${proveedor}/Unificado`, {
          method: "POST",
          body: this.getFormDMS(`Interferencias`),
        }),
      ]);
      const aAreasPromise = await Promise.all(
        aAreas.map((item) => {
          return fetch(`${url}/${idObra}_${proveedor}/Unificado/Carga inicial`, {
            method: "POST",
            body: this.getFormDMS(`${item.descripcion}`),
          });
        })
      );
      return await Promise.all([
        respFolderPrincipal.json(),
        respFolderUnificado.json(),
        respFolderOferta.json(),
        respFolderCargaInicial.json(),
        respFolderNotasPedido.json(),
        respFolderOrdenesServicio.json(),
        respFolderIngenieria.json(),
        respFolderPermisos.json(),
        respFolderSegHigiene.json(),
        respFolderPolizas.json(),
        respFolderInterferencias.json(),
        ...aAreasPromise.map((item) => item.json()),
      ]);
    },

    getFormDMS: function (folder) {
      const oForm = new FormData();
      oForm.append("cmisaction", "createFolder");
      oForm.append("propertyId[0]", "cmis:name");
      oForm.append("propertyValue[0]", folder);
      oForm.append("propertyId[1]", "cmis:objectTypeId");
      oForm.append("propertyValue[1]", "cmis:folder");
      oForm.append("_charset_", "UTF-8");
      oForm.append("succinct", true);
      return oForm;
    },

    postWorkflow: async function (body) {
      const resp = await fetch(`${this._urlWF}/v1/xsrf-token`, {
        method: "GET",
        headers: {
          "X-CSRF-Token": "Fetch",
        },
      });
      const token = resp.headers.get("x-csrf-token");
      const response = await fetch(`${this._urlWF}/v1/workflow-instances`, {
        method: "POST",
        headers: {
          "X-CSRF-Token": token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      return response;
    },

    createPreconstruccion: function () {
      return this.callPostService("Preconstrucciones", { estado_ID: "BO" });
    },

    createPdf: async function (oPayload) {
      const url = `${this._urlPdfApi}/`;
      const oData = await fetch(url, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(oPayload)
      });
      return await oData.json();
    },
  };
});
