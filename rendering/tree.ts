type TreeNode<T> = {
      dx: TreeNode<T> | null,
      sx: TreeNode<T> | null,
      value: T | null,
}

class Tree<T> {
      root: TreeNode<T> = {
            dx: null,
            sx: null,
            value: null,
      }
      constructor(){}
      set( data: T ) {

      }
      fetch( value: T ){
            if( value <= this.root.value! )
                  return this.root;
            this.fetchSx( value, this.root );
      }
      fetchSx( value: T, node: TreeNode<T> ): TreeNode<T> | null {
            if( !node.sx )
                  return null;
            else if( node.sx.value ){
                  if( node.sx.value >= value )
                        return node.sx;
            }
            let res = this.fetchSx( value, node.sx );
            if( res )
                  return res;
            return this.fetchDx( value, node.sx );
      }
      fetchDx( value: T, node: TreeNode<T> ): TreeNode<T> | null {
            if( !node.dx )
                  return null;
            else if( node.dx.value ){
                  if( node.dx.value >= value )
                        return node.sx;
            }
            let res = this.fetchSx( value, node.dx );
            if( res )
                  return res;
            return this.fetchDx( value, node.dx );
      }
}
const tree = new Tree<number>()
tree.root.sx = {
      sx: {
            value: 1,
            sx: {
                  value: 2,
                  sx: null,
                  dx: null,
            },
            dx: {
                  value: 3,
                  sx: null,
                  dx: null,
            }
      },
      dx: {
            sx: {
                  value: 5,
                  sx: {
                        value: 6,
                        sx: null,
                        dx: null,
                  },
                  dx: null,
            },
            dx: null,
            value: 4
      },
      value: 0
}
console.log( tree.fetch( 4 ) );