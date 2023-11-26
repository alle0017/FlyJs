export var Load;
(function (Load) {
    async function imageAsHTML(path) {
        const img = new Image();
        img.src = path;
        return new Promise((resolve, reject) => {
            img.onload = () => {
                resolve(img);
            };
            img.onerror = () => reject();
        });
    }
    Load.imageAsHTML = imageAsHTML;
    async function image(path) {
        const img = await imageAsHTML(path);
        return await createImageBitmap(img);
    }
    Load.image = image;
})(Load || (Load = {}));
