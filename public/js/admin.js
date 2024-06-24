const deleteProduct = (btn) => {
    const prodId = btn.parentNode.querySelector('[name=productId]').value;
    const csrf = btn.parentNode.querySelector('[name=_csrf]').value;

    const productElement = btn.closest('article');

    fetch(`/admin/product/${prodId}`, {
        method: 'DELETE',
        headers: {
            'csrf-token': csrf,
            'Content-Type': 'application/json'
        },
    }).then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    }).then(data => {
        console.log(data);
        if (data.message === 'Successful') {
            productElement.parentNode.removeChild(productElement);
        } else {
            console.log('Delete operation failed');
        }
    }).catch(err => {
        console.error('Error during deletion:', err);
    });
};
