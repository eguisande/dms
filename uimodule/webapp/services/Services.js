sap.ui.define([], function () {
  "use strict";
  return {
    _urlCatalog: null,
    _urlDMS: null,
    _urlWF: null,
    _urlUserApi: null,

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
    setUrl: function (urlCatalog, urlDMS, urlWF, urlUserApi) {
      this._urlCatalog = urlCatalog;
      this._urlDMS = urlDMS;
      this._urlWF = urlWF;
      this._urlUserApi = urlUserApi;
    },

    getObras: function () {
      return this.callGetService(
        "Obras?$expand=fluido,tipo_obra,inspectores($expand=inspector($expand=tipo_inspector)),gerencia,direccion,estado,sistema,tipo_contrato,partido,contratista,pi($expand=tipo_pi)"
      );
    },
    getObra: function (ID) {
      return this.callGetService(
        `Obras/${ID}?$expand=fluido,tipo_obra,inspectores($expand=inspector($expand=tipo_inspector)),gerencia,direccion,estado,sistema,tipo_contrato,partido,contratista,pi`
      );
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

    getDireccionGerencias: function () {
      return this.callGetService("DireccionGerencias?$expand=gerencia");
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

    postObras: function (oPayload) {
      return this.callPostService("Obras", oPayload);
    },

    updateObra: function (ID, oPayload) {
      return this.callUpdateService(`Obras/${ID}`, oPayload);
    },

    getUser: async function () {

      const url = `${this._urlUserApi}/attributes`;
      const resp = await fetch(url)
      const user = await resp.json()

      return user;

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
        respFolderOrdenesServicio
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

      await fetch(`${this._urlWF}/v1/workflow-instances`, {
        method: 'POST',
        headers: {
          'X-CSRF-Token': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      //await this.updateObra(ID, { estado_ID: "PE" })
    },

    cretePreconstruccion: function () {
      return this.callPostService("Preconstrucciones", { estado_ID: "BO" });
    }
  };
});
