sap.ui.define([
  "sap/ui/core/format/NumberFormat"
], function (NumberFormat) {
  "use strict";
  return {

    formatDate: function (oDate) {
      if (!oDate) {
        return;
      }
      const [anio, mes, dia] = oDate.split("-");
      return `${dia}/${mes}/${anio}`;
    },

    formatDateToBack: function (oDate) {
      if (!oDate) {
        return;
      }
      return oDate.toJSON().slice(0, 10);
    },

    formatDatePdf: function (oDate) {
      if (!oDate) {
        return;
      }
      const newDate = oDate.toJSON().slice(0, 10);
      const [anio, mes, dia] = newDate.split("-");
      return `${dia}/${mes}/${anio}`;
    },

    formatDateInput: function (oDate) {
      if (!oDate) {
        return;
      }
      const [anio, mes, dia] = oDate.split("-");
      return new Date(anio, mes - 1, dia);
    },

    formatDateTime: function (oDate) {
      if (!oDate) {
        return;
      }
      const date = new Date(oDate);
      const formattedDate = date.toLocaleDateString('es-AR', { month: '2-digit', day: '2-digit', year: 'numeric' });
      return formattedDate;
    },

    formatQuantity: function (nTotal = 0) {
      if (!nTotal) {
        return nTotal;
      }
      const oCurrencyFormat = NumberFormat.getCurrencyInstance({
        currencyCode: false,
        customCurrencies: {
          "ARS": {
            decimals: 2,
            isoCode: "ARS"
          }
        }
      });
      return isNaN(nTotal) ? null : oCurrencyFormat.format(nTotal, "ARS");
    }

  };
});
