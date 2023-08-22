define target '0'
define output '$'

initial state even {
	target / target, R -> odd
	' ' / output, R -> done_even
}

state odd {
	target / target, R -> even
	' ' / output, R -> done_odd
}

state done_even {
	' ' / 'E', R -> done
}

state done_odd {
	' ' / 'O', R -> done
}

state done {
	' ' / output, L -> self
}