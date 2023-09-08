
module.exports = grammar({
  name: 'rdef',

  extras: $ => [
    /\s|\\\r?\n/,
    $.comment,
  ],

  word: $ => $.identifier,

  rules: {

    source_file: $ => repeat(choice(
      $.comment,
      $.include,
      $.enum,
      $.resource,
      $.typedef
    )),

    // ========
    // Comments
    // ========

    comment: $ => token(choice(
      // single line
      seq('//', /(\\+(.|\r?\n)|[^\\\n])*/),
      // multi line
      seq('/*', /[^*]*\*+([^/*][^*]*\*+)*/, '/')
    )),

    // ==============
    // Include Header
    // ==============

    include: $ => seq('#include', $.string),

    // =====
    // Enums
    // =====

    _enum_statement: $ => seq($.identifier, '=', $.number),

    enum_block: $ => seq(
      '{',
      optional(seq(
        repeat1(alias($._enum_statement, $.statement)),
        repeat(seq(',', alias($._enum_statement, $.statement)))
      )),
      '}'
    ),

    enum: $ => seq('enum', alias($.enum_block, $.block), ';'),

    // ===================
    // Type definition
    // ===================

    typedef: $ => seq(
      'type',
      optional($.params),
      optional($.typecode),
      $.identifier,
      alias($._typeblock, $.block),
      ';'
    ),

    _fixedsize: $ => seq('[', field('size', $.number), ']'),

    _typeblock: $ => seq(
      '{',
      repeat(seq(
        optional(alias($._type, $.typecast)),
        choice($.identifier, $.number),
        optional(seq('=', $._rvalue)),
        optional($._fixedsize),
        optional(','))),
      '}'
    ),

    // ===================
    // Resource definition
    // ===================

    resource: $ => seq(
      'resource',
      choice(
        $.builtin,
        seq(
          optional($.params),
          optional($.typecode),
          optional($.typecast),
          optional($.identifier),
          seq(choice($._inline_definition, $.message, $.array, $.archive, $.heavy, $.import, alias($._typeblock, $.block)), ';')
        )
      )
    ),

    _inline_definition: $ => seq(
      choice(
        $.hex_string,
        $.string,
        $.number,
        $.identifier,
        repeat1(seq(
          $.constant,
          optional($.operator)
        ))
      )
    ),

    params: $ => seq(
      '(',
      optional(choice(
        $.identifier,
        $.number,
        $.string,
        seq(choice($.number, $.identifier), ',', $.string)
      )),
      ')'
    ),

    typecode: $ => seq('#', choice(
      seq('\'', /[\w ]{4}/ , '\''),
      /\d+/,
      seq('0x', /[\dA-Fa-f]+/)
    )),

    // ================
    // Archive Resource
    // ================

    archive: $ => seq('archive', $.identifier, alias($._messageblock, $.block)),

    // ==============
    // Array Resource
    // ==============

    import: $ => seq('import', $.string),

    _arrayblock: $ => seq(
      '{',
      optional(seq(
        choice($._rvalue,
               seq($.identifier, alias($._arrayblock, $.block))),
        repeat(seq(',', choice($._rvalue, seq($.identifier, alias($._arrayblock, $.block)))))
      )),
      '}'),

    array: $ => seq(
      'array',
      alias($._arrayblock, $.block)
      // TODO add the trailing semi-colon?
    ),

    // ================
    // Message Resource
    // ================

    _message_assignment: $ => seq(
      optional($.typecode),
      optional(alias($._type, $.typecast)),
      $.string,
      '=',
      optional($.typecast),
      $._rvalue
    ),

    _messageblock: $ => seq(
      '{',
      optional(seq(
        repeat1(alias($._message_assignment, $.statement)),
        repeat(seq(',', alias($._message_assignment, $.statement)))
      )),
      '}'),

    message: $ => seq(
      'message',
      optional(alias($._messageparams, $.params)),
      optional(alias($._messageblock, $.block))
    ),

    what: $ => seq('\'', /[\w ]{4}/, '\''),

    _messageparams: $ => seq(
      '(',
      choice($.number, $.what),
      ')'
    ),

    // ======================
    // Builtin Resource Types
    // ======================

    builtin: $ => choice(
      $._app_flags,
      $._app_name_catalog_entry,
      $._app_signature,
      $._app_version,
      $._file_types,
      $._large_icon,
      $._mini_icon,
      $._vector_icon
    ),

    _app_version_block: $ => seq(
      '{',
      repeat1(alias($._assignment, $.statement)),
      repeat(seq(',', alias($._assignment, $.statement))),
      '}'),

    _hex_string_block: $ => seq('{', $.hex_string, '}'),

    _app_flags: $ => seq(alias('app_flags', $.identifier), repeat1(seq($.constant, optional('|'))), ';'),

    _app_name_catalog_entry: $ => seq(alias('app_name_catalog_entry', $.identifier), $.string, ';'),

    _app_signature: $ => seq(alias('app_signature', $.identifier), $.string, ';'),

    _app_version: $ => seq(alias('app_version', $.identifier), alias($._app_version_block, $.block), ';'),

    _file_types: $ => seq(alias('file_types', $.identifier), $.message, ';'),

    // is array valid for vector_icon? is it required for large & mini?
    _large_icon: $ => seq(alias('large_icon', $.identifier), optional('array'), alias($._hex_string_block, $.block), ';'),
    _mini_icon: $ => seq(alias('mini_icon', $.identifier), optional('array'), alias($._hex_string_block, $.block), ';'),
    _vector_icon: $ => seq(alias('vector_icon', $.identifier), optional('array'), alias($._hex_string_block, $.block), ';'),

    // ===========
    // Heavy Types
    // ===========

    _heavyblock: $ => seq(
      '{',
      choice(seq($.identifier, '=', $._rvalue), $._rvalue),
      repeat(seq(',', choice(seq($.identifier, '=', $._rvalue), $._rvalue))),
      '}'),

    heavy_builtin: $ => choice('rgb_color', 'rect', 'point'),

    heavy: $ => seq($.heavy_builtin, alias($._heavyblock, $.block)),

    // ===============================
    // Assignment/Statement operations
    // ===============================

    // TODO make _assignment public?
    _assignment: $ => seq(
      $.identifier,
      '=',
      optional($.typecast),
      choice(
        $.hex_string,
        $.string,
        $.number,
        $.message,
        $.array,
        repeat1(seq(
          $.constant,
          optional('|')
        ))
      )
    ),

    // =================
    // Basic value types
    // =================

    typecast: $ => seq('(', $._type, ')'),

    _type: $ => choice(
      'bool', 'int8', 'uint8', 'int16', 'uint16', 'int32', 'uint32', 'double',
      'size_t', 'ssize_t', 'off_t', 'time_t', 'float', 'double', 'string', 'raw',
      'array', 'buffer', 'message', 'archive'
    ),

    _rvalue: $ => choice(
      $.string,
      $.hex_string,
      $.number,
      $.array,
      $.message,
      $.heavy,
      $.constant,
      $.identifier
    ),

    // ===============
    // Primitive types
    // ===============

    hex_string: $ => repeat1(seq('$"', /[A-Fa-f0-9]+/, '"')),

    _escape_sequence: _ => token(prec(1, seq(
      '\\',
      choice(
        /[^0ntr]/,
        /[^xuU]/,
        /\d{2,3}/,
        /x[0-9a-fA-F]{2,}/,
        /u[0-9a-fA-F]{4}/,
        /U[0-9a-fA-F]{8}/
      )
    ))),

    string: $ => prec.right(repeat1(seq(
      '"',
      repeat(choice(token.immediate(prec(1, /[^\\"\n]+/)), $._escape_sequence)),
      '"'))),

    number: $ => seq(/\d+/, optional(token.immediate(seq('.', /\d+/)))),

    // number: $ => choice($.integer, $.float),

    // integer: $ => /\d+/,

    // float: $ => /\d+\.\d+/,

    identifier: $ => /[\w_]+/,

    // FIXME: need more precise matching for B_* constants
    constant: $ => choice(/B_[\w_]+/, 'true', 'false'),

    operator: $ => choice('|', '=')
  }
});
