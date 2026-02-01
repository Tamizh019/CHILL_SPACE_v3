mod game_state;
mod routes;

use actix_web::{web, App, HttpServer, middleware};
use actix_cors::Cors;
use std::sync::Mutex;
use game_state::GameState;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    std::env::set_var("RUST_LOG", "info");
    env_logger::init();

    let game_state = web::Data::new(Mutex::new(GameState::new()));

    log::info!("Starting server at http://127.0.0.1:8080");

    HttpServer::new(move || {
        let cors = Cors::default()
            .allow_any_origin()
            .allow_any_method()
            .allow_any_header()
            .max_age(3600);

        App::new()
            .wrap(cors)
            .wrap(middleware::Logger::default())
            .app_data(game_state.clone())
            .service(routes::health_check)
            .configure(routes::config)
    })
    .bind(("127.0.0.1", 8080))?
    .run()
    .await
}
