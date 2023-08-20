# Define constants #
define blank ' '

# Start state #
initial state right {
    # Move right and scan symbols #
    '1' / '1', R -> self
    '0' / '0', R -> self
    blank / blank, L -> carry
}

# Carry state #
state carry {
    '1' / '0', L -> self
    '0' / '1', L -> done
    blank / '1', L -> done
}

# Done state #
state done {
    # Halt state #
}