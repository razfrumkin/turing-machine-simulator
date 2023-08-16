define blank ' '

# convert 0 into x and go to step q1 #
# if symbol is c the convert it into blank, move right and go to q5 #
initial state q0 {
	'c', blank, R -> q5
	'0', 'x', R -> q1
}

# keep ignoring 0s and move towards right #
# ignore c, move right and go to q2 #
state q1 {
	'0', '0', R -> self
	'c', 'c', R -> q2
}

# keep ignoring 0s and move towards right #
# convert a blank into 0, move left and go to q3 #
state q2 {
	'0', '0', R -> self
	blank, '0', L -> q3
}

# keep ignoring 0s and move towards left #
# ignore c, move left and go to q4 #
state q3 {
	'0', '0', L -> self
	'c', 'c', L -> q4
}

# keep ignoring 0s and move towards left #
# ignore x, move right and go to q0 #
state q4 {
	'0', '0', L -> self
	'x', 'x', R -> q0
}

# end #
state q5 {
	
}