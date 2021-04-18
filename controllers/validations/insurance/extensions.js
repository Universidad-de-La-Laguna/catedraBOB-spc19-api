const ibantools = require("ibantools");

const extendYup = (yup) => {
  yup.addMethod(yup.string, "iban", function () {
    return this.test("iban", "Wrong IBAN", (str) => {
      if (!yup.string().isType(str)) return str;

      return ibantools.isValidIBAN(str);
    });
  });

  yup.addMethod(yup.array, "unique", function (message, mapper = (a) => a) {
    return this.test("unique", message, function (list) {
      if (!yup.array().isType(list)) return list;

      const uniqueValues = new Set(list.map(mapper));
      return list.length === uniqueValues.size;
    });
  });

  yup.addMethod(yup.array, "sameLength", function (otherArray, message) {
    return this.test("same_length", message, (value, context) => {
      if (!yup.array().isType(value)) return value;
      if (!yup.array().isType(context.parent[otherArray]))
        return context.parent[otherArray];

      return context.parent[otherArray].length === value.length;
    });
  });

  yup.addMethod(
    yup.array,
    "sameOrderedElements",
    function (otherArray, prop, message) {
      return this.test("sameOrderedElements", message, (list, context) => {
        if (!yup.array().isType(list)) return list;
        if (!yup.array().isType(context.parent[otherArray]))
          return context.parent[otherArray];

        return context.parent[otherArray].every(
          (element, idx) => element[prop] === list[idx][prop]
        );
      });
    }
  );

  return yup;
};

module.exports = { extendYup };
