# ouid

`ouid` (ordered unique identifier) generates universally-unique identifiers that sort in ascending order; i.e., each identifier will be greater than the last. This is important for performance reasons when inserting them into a database because B-tree indexes will not need to be rebalanced as new nodes are added -- each new entry will become a leaf node.

For convenience, there is also an ASCII variant that can be used in URLs or other places where binary cannot, and utility functions for converting between the two forms.