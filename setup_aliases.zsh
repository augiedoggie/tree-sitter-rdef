#!/usr/bin/env zsh

alias ts="tree-sitter"
alias tg="tree-sitter generate"
alias th="tree-sitter highlight"
alias thh="tree-sitter highlight -H"
alias tp="tree-sitter parse"

#alias tt="tree-sitter test"
function tt() {
    tree-sitter test "$@" | $PAGER
}
