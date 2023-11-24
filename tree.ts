type Node<T> = {
      dx: Node<T> | undefined;
      sx: Node<T> | undefined;
      value: T | undefined;
}
type Leaf<T> = {
      dx: undefined;
      sx: undefined;
      value: T;
}
export class Tree<T> {
      private root: Node<T>;
      get level(): number {
            let i = 0;
            for( let node = this.root; node && node.sx; node = node.sx )
                  i++;
            return i;
      }
      private set level( n: number ) {}


      constructor( value?: T ){
            this.root = {
                  dx: undefined,
                  sx: undefined,
                  value: undefined,
            }
      }
      isLeaf( node: Node<T> ): node is Leaf<T> {
            return !node.dx && !node.sx;
      }
      conditionalResearch( condition: ( node: Node<T> )=>boolean, node: Node<T> = this.root ): Node<T> | undefined {
            if( !node )
                  return undefined;
            if( condition( node ) )
                  return node;
            let val: Node<T> | undefined;
            if( node.sx ){
                  val = this.conditionalResearch( condition, node.sx );
                  if( val )
                        return val;
            } 
            if( node.dx ){
                  val = this.conditionalResearch( condition, node.dx );
                  if( val )
                        return val;
            }
            return undefined;
      }
      remove( value: T, node: Node<T> = this.root, parent: Node<T> = this.root ): boolean {
            if( !node ) 
                  return false;
            if( node != parent && node.value == value ){
                  if( parent.sx == node ){
                        parent.sx = node.sx;
                  }else {
                        parent.dx = node.sx;
                  }
                  if( node.dx && node.dx.value )
                        this.insert( node.dx.value );
                  return true;
            }
            if( !this.remove( value, node.sx, node ) )
                  return this.remove( value, node.dx, node );
            return false;
      }
      search( value: T, node: Node<T> = this.root ): Node<T> | undefined {
            if( !node )
                  return undefined;
            if( node.value === value )
                  return node;
            let val: Node<T> | undefined;
            if( node.sx ){
                  val = this.search( value, node.sx );
                  if( val )
                        return val;
            } 
            if( node.dx ){
                  val = this.search( value, node.dx );
                  if( val )
                        return val;
            }
            return undefined;
      }
      insert( value: T ){
            const node = this.conditionalResearch( ( node: Node<T>) =>{
                  return !node.dx || !node.sx;
            } );
            if( !node ){
                  this.root.value = value;
            }else if( !node.sx ){
                  node.sx = {
                        sx: undefined,
                        dx: undefined,
                        value
                  }
            }else{
                  node.dx = {
                        sx: undefined,
                        dx: undefined,
                        value
                  }
            }
      }
      forEach( callback: ( value: T, node?: Node<T> )=>void, node: Node<T> = this.root ){
            if( !node )
                  return;
            if( node.value )
                  callback( node.value, node );
            if( node.sx ){
                  this.forEach( callback, node.sx );
            }
            if( node.dx ){
                  this.forEach( callback, node.dx );
            }
            return;
      }
}