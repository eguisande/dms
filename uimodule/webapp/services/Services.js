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
          .then((response) => res(response.json()))
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
          .then((response) => res(response.json()))
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
          .then((response) => res(response))
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
        "Obras?$expand=fluido,tipo_obra,inspectores($expand=inspector($expand=tipo_inspector)),gerencia,direccion,estado,sistema,tipo_contrato,partido,contratista,pi($expand=tipo_pi)"
      );
    },
    getObrasJefeInspector: function (usuario, tipo_inspector) {
      return this.callGetService(
        `getObrasByInspector(usuario='${usuario}',tipo_inspector='${tipo_inspector}')?$expand=fluido,tipo_obra,inspectores($expand=inspector($expand=tipo_inspector)),gerencia,direccion,estado,sistema,tipo_contrato,partido,contratista,pi($expand=tipo_pi)`
      );
    },
    getObrasByContratista: function (usuario) {
      return this.callGetService(
        `getObrasByContratista(usuario='${usuario}')?$expand=fluido,tipo_obra,inspectores($expand=inspector($expand=tipo_inspector)),gerencia,direccion,estado,sistema,tipo_contrato,partido,contratista,pi($expand=tipo_pi)`
      );
    },
    getObra: function (ID) {
      return this.callGetService(
        `Obras/${ID}?$expand=fluido,tipo_obra,inspectores($expand=inspector($expand=tipo_inspector)),gerencia,direccion,estado,sistema,tipo_contrato,partido,contratista,pi`
      );
    },

    deleteObra: function (ID) {
      return this.callDeleteService(`Obras/${ID}`);
    },

    getDirecciones: function () {
      return this.callGetService("Direcciones");
    },

    getValidatePIPorveedor: function (proyecto_inversion, nro_proveedor) {
      return this.callGetService(`validatePIPorveedor(proyecto_inversion='${proyecto_inversion}',nro_proveedor='${nro_proveedor}')`);
    },

    getQuantity: function (proyecto_inversion) {
      return this.callGetService(`getQuantity(proyecto_inversion='${proyecto_inversion}')`);
    },

    getContratista: function (registro_proveedor) {
      return this.callGetService(`getContratista(registro_proveedor='${registro_proveedor}')`);
    },
    getContratistas: function (registro_proveedor) {
      return this.callGetService("Contratistas?$expand=tipo_documento,tipo_contratista");
    },

    getOCQuantity: function (proyecto_inversion) {
      return this.callGetService(`getOCQuantity(proyecto_inversion='${proyecto_inversion}')`);
    },

    getInspectores: function () {
      return this.callGetService("Inspectores?$expand=tipo_inspector");
    },

    getGerencias: function () {
      return this.callGetService("Gerencias");
    },

    getTiposContratos: function () {
      return this.callGetService("TiposContratos");
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
      return this.callGetService("UnidadesMedida");
    },
    getSistemasContratacion: function () {
      return this.callGetService("SistemasContratacion");
    },
    getFinanciamientos: function () {
      return this.callGetService("Financiamientos");
    },

    postObra: function (oPayload) {
      return this.callPostService("Obras", oPayload);
    },

    updateObra: function (ID, oPayload) {
      return this.callUpdateService(`Obras/${ID}`, oPayload);
    },

    getUser: async function () {
      try {
        if (window.location.hostname === "localhost") {
          return {
            "firstname": "Maximiliano",
            "lastname": "Guisande",
            "email": "maximiliano.guisande@datco.net",
            "name": "maximiliano.guisande@datco.net",
            "scopes": [
              "openid",
              "uaa.user"
            ],
            "user_uuid": [
              "64ff52e3-7bef-4706-be6f-645d504d12a0"
            ],
            "Groups": [
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
              "WorkflowManagementEndUser"
            ],
            "acr": [
              "urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport"
            ]
          }
        }
        const url = `${this._urlUserApi}/attributes`;
        const resp = await fetch(url)
        const user = await resp.json()
        return user;
      } catch (error) {
        console.log(error)
      }
    },

    creteFolderDMS: async function (folder, proveedor, aAreas = []) {
      const url = `${this._urlDMS}/Obras`;
      const respFolderPrincipal = await fetch(url, {
        method: "POST",
        body: this.getFormDMS(`${folder}_${proveedor}`),
      });
      const [
        respFolderOferta,
        respFolderCargaInicial,
        respFolderNotasPedido,
        respFolderOrdenesServicio,
        respFolderPresentaciones
      ] = await Promise.all([
        //_${proveedor}
        fetch(`${url}/${folder}_${proveedor}`, {
          method: "POST",
          body: this.getFormDMS(`Oferta`),
        }),
        fetch(`${url}/${folder}_${proveedor}`, {
          method: "POST",
          body: this.getFormDMS(`Carga inicial`),
        }),
        fetch(`${url}/${folder}_${proveedor}`, {
          method: "POST",
          body: this.getFormDMS(`Notas de pedido`),
        }),
        fetch(`${url}/${folder}_${proveedor}`, {
          method: "POST",
          body: this.getFormDMS(`Órdenes de servicio`),
        }),
        fetch(`${url}/${folder}_${proveedor}`, {
          method: "POST",
          body: this.getFormDMS(`Presentaciones`),        
        }),
        fetch(`${url}/${folder}_${proveedor}`, {
          method: "POST",
          body: this.getFormDMS(`Seguridad e Higiene`),
        })
      ])
      const aAreasPromise = await Promise.all(aAreas.map(item => {
        return fetch(`${url}/${folder}_${proveedor}/Carga inicial`, {
          method: "POST",
          body: this.getFormDMS(`${item.descripcion}`),
        })
      }))
      return await Promise.all([
        respFolderPrincipal.json(),
        respFolderOferta.json(),
        respFolderCargaInicial.json(),
        respFolderNotasPedido.json(),
        respFolderOrdenesServicio.json(),
        respFolderPresentaciones.json(),
        ...aAreasPromise.map(item => item.json())
      ])
    },

    getFormDMS: function (folder) {
      const oForm = new FormData();
      oForm.append("cmisaction", "createFolder");
      oForm.append("propertyId[0]", "cmis:name");
      oForm.append("propertyValue[0]", folder);
      oForm.append("propertyId[1]", "cmis:objectTypeId");
      oForm.append("propertyValue[1]", "cmis:folder");
      oForm.append("_charset_", "UTF-8")
      oForm.append("succinct", true);
      return oForm;
    },

    postWorkflow: async function (body) {
      const resp = await fetch(`${this._urlWF}/v1/xsrf-token`, {
        method: 'GET',
        headers: {
          'X-CSRF-Token': 'Fetch'
        }
      })
      const token = resp.headers.get("x-csrf-token")
      const response = await fetch(`${this._urlWF}/v1/workflow-instances`, {
        method: 'POST',
        headers: {
          'X-CSRF-Token': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })
      return response;
    },

    cretePreconstruccion: function () {
      return this.callPostService("Preconstrucciones", { estado_ID: "BO" });
    },

    createPdf: async function (oPayload) {
      const url = `${this._urlPdfApi}/generatePDF`;
      const oData = await fetch(url, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(oPayload)
      });
      return await Promise.all([oData.text()]);
    }

  };
});
