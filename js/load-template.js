
document.addEventListener("DOMContentLoaded", function() {
	const navContainer = document.getElementById("nav-container");
	const footerContainer = document.getElementById("footer-container");

	fetch("/templates/head.html")
		.then(response => response.text())
		.then(data => document.head.insertAdjacentHTML("beforeend", data))
		.catch(error => console.error("Error loading head:", error));

	fetch("/templates/nav.html")
		.then(response => response.text())
		.then(data => {
			navContainer.innerHTML = data;
			navContainer.style.width = "100%";
			navContainer.style.height = "100%";

			navContainer.querySelectorAll('script').forEach(script => {
				const newScript = document.createElement('script');
				newScript.textContent = script.textContent;
				document.body.appendChild(newScript);
			});

			document.dispatchEvent(new Event('navLoaded'));
		})
		.catch(error => console.error("Error loading nav:", error));

	fetch("/templates/footer.html")
		.then(response => response.text())
		.then(data => {
			footerContainer.innerHTML = data;

			footerContainer.querySelectorAll('script').forEach(script => {
				const newScript = document.createElement('script');
				newScript.textContent = script.textContent;
				document.body.appendChild(newScript);
			});

			document.dispatchEvent(new Event('footerLoaded'));
		})
		.catch(error => console.error("Error loading footer:", error));
});
