<!DOCTYPE html>
<html lang="en">
<head>
  <title>Humberto ZapAutomation - https://disparador.ominichat.app.br/</title>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.0.0-alpha.5/css/bootstrap.min.css">
	<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.1.1/jquery.min.js"></script>
	<script src="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.0.0-alpha.5/js/bootstrap.min.js"></script>
	<link rel="stylesheet" href="index.css">
</head>
<body>

  <?php
    echo "<nav id='menu-h'>";
    echo "<ul>";
    echo "    <li><a href='https://disparador.ominichat.app.br/'>Humberto ZapAutomation</a></li>";
	echo "    <li><a href='index.php'>Conexões</a></li>";
	echo "    <li><a href='index1.php'>Disparo de Texto</a></li>";
	echo "    <li><a href='index2.php'>Disparo de Imagem URL</a></li>";
	echo "    <li><a href='index3.php'>Disparo de Imagem PATH</a></li>";
	echo "    <li><a href='index4.php'>Disparo de Áudio Gravado</a></li>";
    echo "    <li><a target='_blank' href='https://disparador.ominichat.app.br/'><img src='https://comunidadezdg.com.br/wp-content/uploads/elementor/thumbs/icone-p7nqaeuwl6ck4tz33sz0asflw2opfsqwutv8l3hfk0.png' style='height:20px;'><br></a></li>";
    echo "</ul>";
    echo "</nav>";
	echo "<h2>Gestão de Disparos</h2>";
	echo "<hr>";
	
  	if(array_key_exists('button1', $_POST)) {
		button1();
	}
	function button1() {
		$imagem = $_POST['imagem'];
		$min = $_POST['min'];
		$max = $_POST['max'];
		$leads = $_POST['leads'];
		$lines = explode(PHP_EOL, $leads);
		$sessao = $_POST['sessao'];
		$token = $_POST['token'];
		foreach ($lines as $line) {
			sleep ( rand ( $min, $max));
			list($first) = explode(",", $line);
			$curl = curl_init();
			$postData = [ "user" => $line,
				"file" => $imagem,
				"sender" => $sessao,
				"token" => $token
			];
			curl_setopt_array($curl, array(
			  CURLOPT_URL => 'https://manager.ominichat.app.br/send-media3',
			  CURLOPT_RETURNTRANSFER => true,
			  CURLOPT_ENCODING => '',
			  CURLOPT_MAXREDIRS => 10,
			  CURLOPT_TIMEOUT => 0,
			  CURLOPT_FOLLOWLOCATION => true,
			  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
			  CURLOPT_CUSTOMREQUEST => 'POST',
			  CURLOPT_POSTFIELDS => json_encode($postData),
			  CURLOPT_HTTPHEADER => array(
				'Content-Type: application/json'
			  ),
			));

			$response = curl_exec($curl);
			curl_close($curl);
			//echo $response;
			echo 'Número: ' . $line . ' - Sender: ' . $sessao . ' - Status: ' . substr($response,10, 4);
		}
		echo "<hr>";
	}
	
  	echo "<form method='post'>";
	echo "<h4>Envio de mensagem de texto</h4>";
	echo "LEADS => Insira a lista com o ID dos grupos e senders conforme exemplo abaixo<br> <textarea class='form-control' name='leads' id='leads' cols='40' rows='5' placeholder='15687544255&#10;65987542589&#10;54897632598' style='width:50%' required></textarea>";
	echo "<br>";
	echo "Áudio formato OGG => Insira a URL <input style='width:20%' class='form-control' type='text' name='imagem' id='imagem' placeholder='Insira o OGG'>";
	echo "<br>";
	echo "Sessão => Insira a sessão<br><input style='width:20%' class='form-control' type='text' name='sessao' id='sessao' placeholder='Insira a Sessão'>";
	echo "<br>";
	echo "Token => Insira o token<br><input style='width:20%' class='form-control' type='text' name='token' id='token' placeholder='Insira o Token'>";
	echo "<br>";
	echo "Min: <input class='form-control' required placeholder='2' style='width:5%' type='text' name='min' />";
	echo "Max: <input class='form-control' required placeholder='31' style='width:5%' type='text' name='max' />";
	echo "<br>";
	echo "<input class='btn btn-success'type='submit' name='button1' class='button' value='Realizar disparo' />";
	echo "<br>";
	echo "<br>";
	echo "<hr>";
	echo "</form>";
	echo "<hr>";
	echo "<p>Desenvolvido por Humberto ZapAutomation</p>";
  

  

  ?>

</body>
</html>