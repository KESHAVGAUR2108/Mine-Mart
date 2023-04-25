exports.error404 = exports.showError = (req, res, next) => {
	const isLoggedIn = req.session.isLoggedIn;

	res.status(404).render("404", {
		pageTitle: "Page Not Found",
		path: null,
		isAuthenticated: isLoggedIn,
	});
};

exports.error500 = exports.showError = (req, res, next) => {
	const isLoggedIn = req.session.isLoggedIn;

	res.status(500).render("500", {
		pageTitle: "Error",
		path: null,
		isAuthenticated: isLoggedIn,
	});
};
