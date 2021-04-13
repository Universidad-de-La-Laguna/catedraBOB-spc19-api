const ibantools = require("ibantools");

const extendYup = (yup) => {
  yup.addMethod(yup.string, "iban", function () {
    return this.test("iban", "Wrong IBAN", (str) => ibantools.isValidIBAN(str));
  });

  yup.addMethod(yup.array, "unique", function (message, mapper = (a) => a) {
    return this.test("unique", message, function (list) {
      const uniqueValues = new Set(list.map(mapper));
      return list.length === uniqueValues.size;
    });
  });

  yup.addMethod(yup.array, "sameLength", function (otherArray, message) {
    return this.test("same_length", message, (value, context) => {
      return context.parent[otherArray].length === value.length;
    });
  });

  yup.addMethod(
    yup.array,
    "sameOrderedElements",
    function (otherArray, prop, message) {
      return this.test("sameOrderedElements", message, (list, context) =>
        context.parent[otherArray].every(
          (element, idx) => element[prop] === list[idx][prop]
        )
      );
    }
  );

  return yup;
};

module.exports = { extendYup };
