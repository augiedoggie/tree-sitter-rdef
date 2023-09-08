
[ "archive" "array" "enum" "import" "message" "resource" "type" ] @keyword

;; [ "=" "-" "+" "*" "/" "%" "^" "|" "&" "~" ] @operator
[ "=" "|" ] @operator

[ "(" ")" "{" "}" "[" "]" ] @punctuation.bracket

;; [ "," "." ";" ] @punctuation.delimiter
[ "," ";" ] @punctuation.delimiter

;; (what) @variable.parameter
;; (params (_) @variable.parameter)
(builtin (identifier) @function.builtin)
(heavy_builtin) @function.builtin
(comment) @comment
(constant) @constant
(number) @number
(operator) @operator
(string) @string
(hex_string) @string
(identifier) @variable
(what) @string.special
(typecode) @string.special
