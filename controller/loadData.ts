export namespace Load{
      export async function image(path: string): Promise<HTMLImageElement> {
            const img = new Image();
            img.src = path;
            return new Promise((resolve, reject)=>{
                  img.onload = () =>{
                        resolve(img);
                  }
                  img.onerror = () => reject();
            })
      }
}